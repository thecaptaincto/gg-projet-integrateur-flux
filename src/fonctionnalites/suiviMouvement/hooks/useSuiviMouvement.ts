// useSuiviMouvement.ts — Hook principal d'une session d'entraînement.
// Orchestrate GPS, podomètre et accéléromètre en deux modes :
//   - Simulation : rejoue une trajectoire préenregistrée (simulatedSensors)
//   - Réel       : écoute les capteurs natifs (deviceSensors)
//
// Algorithme de distance hybride :
//   CAS 1 — GPS fiable (accuracy ≤ 15 m) + mouvement physique détecté → distance Haversine point à point
//   CAS 2 — GPS imprécis ou absent + pas qui avancent → distance podomètre (pas × 0.7 m/pas)
//
// Autres fonctionnalités :
//   - Filtre anti-saut GPS (vitesse > 8 m/s ≈ 28.8 km/h rejetée)
//   - Lissage des vitesses et altitudes par moyenne mobile (fenêtre de 5 valeurs)
//   - Allure glissante sur fenêtre de 60 s (Strava-style)
//   - Sélection hardware/logiciel du podomètre (détection de pic accéléromètre à défaut)
//   - Dénivelé cumulé positif et négatif
//   - Trace GPS (jusqu'à 1000 points, delta min 3 m)
//   - Gestion pause / reprise sans double-comptage

import {useCallback, useEffect, useRef, useState} from 'react';
import type {
  ConfigSuivi,
  DonneesAccelerometre,
  EtatSuivi,
  PointTrace,
  PositionGPS,
  ResumeSuivi,
} from '../sensors/types';
import {CONFIG_DEFAUT} from '../sensors/types';
import {
  demanderPermissionGPS,
  demanderPermissionPodometre,
  souscrireAccelerometre,
  souscrirePodometre,
  souscrirePositionGPS,
  verifierDisponibilitePodometre,
} from '../sensors/deviceSensors';
import {SourceCapteursSimules} from '../sensors/simulatedSensors';
import {
  appliquerZoneMorte,
  calculerDistanceMetres,
  calculerMagnitudeAccel,
  calculerDistanceTrace,
  creerCompteurPas,
  creerFiltreMoyenneMobile,
  cumulerDenivele,
  extraireVitesseMs,
  msVersKmh,
  vitesseVersAllure,
} from '../utils/calculations';

interface OptionsHook {
  config?: ConfigSuivi;
  simulation?: boolean;
}

const ETAT_INITIAL: EtatSuivi = {
  latitude: null,
  longitude: null,
  altitude: null,
  precisionGps: null,
  vitesseMs: null,
  vitesseKmh: null,
  vitesseLissee: null,
  vitesseLisseeKmh: null,
  altitudeLissee: null,
  nombrePasSession: null,
  accelerometre: null,
  agitation: null,
  allureSecParKm: null,
  numeroTrame: 0,
  erreurs: [],
  estActif: false,
  estEnPause: false,
  dureeSecondes: 0,
  distanceMetres: 0,
  denivelePositifMetres: 0,
  deniveleNegatifMetres: 0,
  traceParcours: [],
};

// Filtre anti-absurde : vitesse maximale plausible (m/s) pour la course.
// 8 m/s ≈ 28.8 km/h. Au-delà, on traite ça comme un saut GPS.
const VITESSE_MAX_PLAUSIBLE_MS = 8;

// Longueur de pas moyenne pour un adulte qui marche (en mètres).
// Valeur utilisée en fallback intérieur quand le GPS est imprécis.
const LONGUEUR_PAS_METRES = 0.7;
const DISTANCE_MIN_TRACE_METRES = 3;
const DELAI_MAX_TRACE_MS = 5_000;
const TAILLE_MAX_TRACE = 1000;

export function useSuiviMouvement(options: OptionsHook = {}) {
  const {config = CONFIG_DEFAUT, simulation = false} = options;

  const [etat, setEtat] = useState<EtatSuivi>(ETAT_INITIAL);
  const [resumeSession, setResumeSession] = useState<ResumeSuivi | null>(null);

  // Refs session
  const positionPrecedenteRef = useRef<PositionGPS | null>(null);
  const pasDepartRef = useRef<number | null>(null);
  const trameRef = useRef(0);
  const distanceTotaleRef = useRef(0);
  const denivelePositifRef = useRef(0);
  const deniveleNegatifRef = useRef(0);
  const traceParcoursRef = useRef<PointTrace[]>([]);
  const heureDebutSegmentRef = useRef<number | null>(null);
  const dureeAccumuleeRef = useRef(0);
  const pasAccumulesRef = useRef<number>(0);

  // Refs capteurs
  const simulRef = useRef<SourceCapteursSimules | null>(null);
  const annulerCapteursRef = useRef<null | (() => void)>(null);
  const callbackSimulRef = useRef<
    ((trame: ReturnType<SourceCapteursSimules['lireTrame']>) => void) | null
  >(null);
  const estEnPauseRef = useRef(false);

  // Refs de filtrage GPS (mode capteurs réels)
  // Historique glissant des 6 dernières valeurs d'agitation (3 secondes à 500ms/tick).
  // Sert à détecter un mouvement physique soutenu, pas juste un tremblement ponctuel.
  const historiqueAgitationRef = useRef<number[]>([]);
  // Compteur de pas au moment du dernier checkpoint podomètre pour calculer le delta de pas
  const pasAuDernierCheckpointPodoRef = useRef<number>(0);
  // Seuil à 0.6 m/s² : plus permissif que le défaut du module (0.8) pour capter la marche
  // lente sur tablette, mais suffisamment restrictif pour filtrer le bruit (secousse de la
  // main, tapotement sur l'écran). La marche normale génère typiquement 1-2 m/s².
  const compteurPasLogicielRef = useRef(creerCompteurPas(0.6, 280));
  const pasLogicielsRef = useRef<number>(0);
  const derniersPasRef = useRef<number | null>(null);
  const bufferAllureRef = useRef<{timestamp: number; distance: number}[]>([]);

  const dureeSecondesCourantes = () =>
    dureeAccumuleeRef.current +
    (heureDebutSegmentRef.current
      ? (Date.now() - heureDebutSegmentRef.current) / 1000
      : 0);

  const enregistrerPointTrace = useCallback((position: PositionGPS | null) => {
    if (!position) {
      return;
    }

    const point: PointTrace = {
      latitude: position.latitude,
      longitude: position.longitude,
      altitude: position.altitude,
      timestamp: position.timestamp,
    };

    const dernierPoint =
      traceParcoursRef.current[traceParcoursRef.current.length - 1] ?? null;

    if (!dernierPoint) {
      traceParcoursRef.current = [point];
      return;
    }

    const distance = calculerDistanceTrace(dernierPoint, point);
    const deltaTemps = point.timestamp - dernierPoint.timestamp;
    const {gain, perte} = cumulerDenivele(dernierPoint.altitude, point.altitude);

    if (
      distance < DISTANCE_MIN_TRACE_METRES &&
      deltaTemps < DELAI_MAX_TRACE_MS &&
      gain === 0 &&
      perte === 0
    ) {
      return;
    }

    denivelePositifRef.current += gain;
    deniveleNegatifRef.current += perte;
    traceParcoursRef.current = [...traceParcoursRef.current, point].slice(
      -TAILLE_MAX_TRACE,
    );
  }, []);

  // -- traiterTrame : utilisé uniquement par le mode simulation --
  // En mode réel, les filtres et le checkpoint sont calculés dans demarrerCapteurs.
  const traiterTrame = useCallback(
    (
      position: PositionGPS | null,
      nombrePasTotal: number | null,
      accel: DonneesAccelerometre | null,
    ) => {
      const erreurs: string[] = [];
      trameRef.current++;

      if (nombrePasTotal !== null && pasDepartRef.current === null) {
        pasDepartRef.current = nombrePasTotal;
      }
      const nombrePasSession =
        nombrePasTotal !== null && pasDepartRef.current !== null
          ? nombrePasTotal - pasDepartRef.current
          : null;

      let vitesseMs: number | null = null;
      if (position) {
        const precedente = positionPrecedenteRef.current;
        const vitesseCapteur =
          position.speed !== null && position.speed >= 0 ? position.speed : null;

        if (precedente) {
          const dt = (position.timestamp - precedente.timestamp) / 1000;
          if (dt > 0) {
            const deltaHaversine = calculerDistanceMetres(
              precedente.latitude,
              precedente.longitude,
              position.latitude,
              position.longitude,
            );
            const vitesseHaversine = deltaHaversine / dt;

            const vitesseHaversineOk = vitesseHaversine <= VITESSE_MAX_PLAUSIBLE_MS;
            const vitesseCapteurOk =
              vitesseCapteur !== null && vitesseCapteur <= VITESSE_MAX_PLAUSIBLE_MS;

            if (vitesseHaversineOk) {
              distanceTotaleRef.current += deltaHaversine;
              vitesseMs =
                vitesseCapteurOk && vitesseCapteur > 0
                  ? vitesseCapteur
                  : vitesseHaversine;
            } else if (vitesseCapteurOk) {
              distanceTotaleRef.current += vitesseCapteur * dt;
              vitesseMs = vitesseCapteur;
              erreurs.push(
                `Saut GPS filtré (vitesse calculée ${msVersKmh(vitesseHaversine).toFixed(1)} km/h)`,
              );
            } else {
              erreurs.push(
                `Point ignoré (vitesse calculée ${msVersKmh(vitesseHaversine).toFixed(1)} km/h)`,
              );
              vitesseMs = null;
            }

            const sautEnorme =
              deltaHaversine > 250 || vitesseHaversine > VITESSE_MAX_PLAUSIBLE_MS * 3;
            if (!sautEnorme) {
              positionPrecedenteRef.current = position;
            }
          } else {
            if (vitesseCapteur !== null && vitesseCapteur <= VITESSE_MAX_PLAUSIBLE_MS) {
              vitesseMs = vitesseCapteur;
            }
          }
        } else {
          if (vitesseCapteur !== null && vitesseCapteur <= VITESSE_MAX_PLAUSIBLE_MS) {
            vitesseMs = vitesseCapteur;
          }
          positionPrecedenteRef.current = position;
        }

        enregistrerPointTrace(position);
      }

      const dureeSecondes = Math.round(dureeSecondesCourantes());

      setEtat({
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        altitude: position?.altitude ?? null,
        precisionGps: position?.accuracy ?? null,
        altitudeLissee: position?.altitude ?? null,
        vitesseMs,
        vitesseKmh: vitesseMs !== null ? msVersKmh(vitesseMs) : null,
        vitesseLissee: vitesseMs,
        vitesseLisseeKmh: vitesseMs !== null ? msVersKmh(vitesseMs) : null,
        nombrePasSession,
        accelerometre: accel,
        agitation: null,
        allureSecParKm: vitesseVersAllure(vitesseMs),
        numeroTrame: trameRef.current,
        erreurs,
        estActif: true,
        estEnPause: false,
        dureeSecondes,
        distanceMetres: distanceTotaleRef.current,
        denivelePositifMetres: denivelePositifRef.current,
        deniveleNegatifMetres: deniveleNegatifRef.current,
        traceParcours: traceParcoursRef.current,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enregistrerPointTrace],
  );

  const reinitialiserRefsSession = useCallback(() => {
    positionPrecedenteRef.current = null;
    pasDepartRef.current = null;
    trameRef.current = 0;
    distanceTotaleRef.current = 0;
    denivelePositifRef.current = 0;
    deniveleNegatifRef.current = 0;
    traceParcoursRef.current = [];
    dureeAccumuleeRef.current = 0;
    heureDebutSegmentRef.current = null;
    estEnPauseRef.current = false;
    historiqueAgitationRef.current = [];
    pasAuDernierCheckpointPodoRef.current = 0;
    compteurPasLogicielRef.current.reinitialiser();
    pasLogicielsRef.current = 0;
    derniersPasRef.current = null;
    pasAccumulesRef.current = 0;
    bufferAllureRef.current = [];
  }, []);

  // -- Mode simulation --
  const demarrerSimulation = useCallback(() => {
    if (simulRef.current) {
      return;
    }
    reinitialiserRefsSession();
    heureDebutSegmentRef.current = Date.now();

    const simul = new SourceCapteursSimules();
    simulRef.current = simul;

    const cb = (trame: ReturnType<typeof simul.lireTrame>) => {
      traiterTrame(trame.position, trame.nombrePasTotal, trame.accelerometre);
    };
    callbackSimulRef.current = cb;
    simul.demarrer(config.intervalleSondageMs, cb);

    setEtat(prev => ({...prev, estActif: true, estEnPause: false, erreurs: []}));
  }, [config.intervalleSondageMs, reinitialiserRefsSession, traiterTrame]);

  // -- Mode capteurs réels --
  const demarrerCapteurs = useCallback((reinitialiser = true) => {
    if (annulerCapteursRef.current) {
      return;
    }
    if (reinitialiser) {
      reinitialiserRefsSession();
    } else {
      // Reprise après pause : effacer l'ancienne position pour empêcher un delta
      // fantôme au premier tick (distance entre position pré-pause et post-pause).
      // Les autres refs (distance, durée, pas accumulés) restent intactes.
      positionPrecedenteRef.current = null;
    }
    heureDebutSegmentRef.current = Date.now();

    // Feedback visuel immédiat avant les opérations async
    setEtat(prev => ({...prev, estActif: true, estEnPause: false, erreurs: []}));

    let dernierePosition: PositionGPS | null = null;
    let derniereAccel: DonneesAccelerometre | null = null;
    let dernierTickMs = Date.now();
    let dernierNombrePasTick = 0;

    // Filtres de lissage
    const filtreVitesse = creerFiltreMoyenneMobile(5);
    const filtreAltitude = creerFiltreMoyenneMobile(5);
    const filtreAgitation = creerFiltreMoyenneMobile(5);

    let annulerAccel: (() => void) | null = null;
    let annulerPodo: (() => void) | null = null;
    let annulerGPS: (() => void) | null = null;

    // Intervalle UI (500ms) : démarré IMMÉDIATEMENT pour que la trame, la durée
    // et les valeurs lissées tiquent même pendant que les capteurs s'initialisent.
    // Auparavant, un await souscrirePositionGPS lent bloquait tout le suivi.
    const intervalId = setInterval(() => {
      const trameErreurs: string[] = [];
      trameRef.current++;
      const maintenant = Date.now();
      const deltaTempsTickSecondes = Math.max(
        (maintenant - dernierTickMs) / 1000,
        0.001,
      );
      const distanceAvantAccumulation = distanceTotaleRef.current;

      // Sélection hardware/logiciel : le podomètre matériel est prioritaire quand il émet
      // des données. Sur les appareils où il est silencieux (ex. tablette tenue à l'horizontale),
      // on bascule sur le compteur logiciel alimenté par l'accéléromètre.
      const hardwarePodoActif = derniersPasRef.current !== null;
      if (hardwarePodoActif && pasDepartRef.current === null) {
        pasDepartRef.current = derniersPasRef.current;
      }
      const nombrePasSession =
        hardwarePodoActif && pasDepartRef.current !== null
          ? pasAccumulesRef.current + (derniersPasRef.current! - pasDepartRef.current)
          : pasAccumulesRef.current > 0
            ? pasAccumulesRef.current
            : pasLogicielsRef.current > 0
              ? pasLogicielsRef.current
              : null;
      const nombrePasActuel = nombrePasSession ?? 0;
      const deltaPasTick = Math.max(nombrePasActuel - dernierNombrePasTick, 0);

      const vitesseMs = extraireVitesseMs(
        dernierePosition,
        positionPrecedenteRef.current,
        trameErreurs,
      );

      // Altitude : filtre seul (pas de zone morte)
      let altitudeLissee: number | null = null;
      if (dernierePosition !== null && dernierePosition.altitude !== null) {
        filtreAltitude.ajouter(dernierePosition.altitude);
        altitudeLissee = filtreAltitude.moyenne();
      }

      const agitation = appliquerZoneMorte(filtreAgitation.moyenne(), 0.1);

      // Historique glissant des 6 dernières valeurs d'agitation (3 secondes)
      historiqueAgitationRef.current.push(filtreAgitation.moyenne());
      if (historiqueAgitationRef.current.length > 6) {
        historiqueAgitationRef.current.shift();
      }

      // "Mouvement physique" = au moins 2 des 6 dernières trames ont agitation > 0.12 m/s².
      // Seuils abaissés (défaut 0.3 / 3 trames) pour mieux détecter la marche lente et la
      // tablette tenue à l'horizontale qui génère peu d'oscillation.
      // Compromis connu : un véhicule en mouvement (autobus, voiture passager) génère
      // suffisamment de vibration pour franchir ce seuil — la distance sera alors calculée
      // via GPS (CAS 1) si l'accuracy est bonne, ce qui reste correct.
      const nombreTramesEnMouvement = historiqueAgitationRef.current.filter(
        v => v > 0.12,
      ).length;
      const enMouvementPhysique = nombreTramesEnMouvement >= 2;
      const enMouvementConfirme = enMouvementPhysique || deltaPasTick > 0;

      const gpsFiable =
        dernierePosition !== null &&
        dernierePosition.accuracy !== null &&
        dernierePosition.accuracy <= 15;

      if (gpsFiable && enMouvementConfirme) {
        // CAS 1 : GPS fiable + mouvement → accumulation point à point (Strava-style)
        if (positionPrecedenteRef.current !== null) {
          const delta = calculerDistanceMetres(
            positionPrecedenteRef.current.latitude,
            positionPrecedenteRef.current.longitude,
            dernierePosition!.latitude,
            dernierePosition!.longitude,
          );
          // Filtre anti-saut : ignorer les deltas absurdes (> 50m en 500ms = 100 m/s)
          if (delta > 0 && delta < 50) {
            distanceTotaleRef.current += delta;
            if (__DEV__) {
              console.log('[DISTANCE GPS]', {
                delta: delta.toFixed(2),
                total: distanceTotaleRef.current.toFixed(1),
              });
            }
          }
        }
        // Le checkpoint podomètre suit le compte actuel pendant le CAS 1 pour éviter
        // un saut artificiel si le GPS se dégrade : les pas déjà couverts par GPS
        // ne seraient sinon re-comptés dans le CAS 2 à la transition.
        pasAuDernierCheckpointPodoRef.current = nombrePasActuel;
      } else if (
        enMouvementConfirme &&
        nombrePasActuel > pasAuDernierCheckpointPodoRef.current
      ) {
        // CAS 2 : GPS pas fiable mais pas qui avancent → distance via podomètre
        const nouveauxPas = nombrePasActuel - pasAuDernierCheckpointPodoRef.current;
        const distancePas = nouveauxPas * LONGUEUR_PAS_METRES;
        distanceTotaleRef.current += distancePas;
        pasAuDernierCheckpointPodoRef.current = nombrePasActuel;
        if (__DEV__) {
          console.log('[CHECKPOINT PAS]', {
            pas: nouveauxPas,
            ajoute: distancePas.toFixed(2),
            total: distanceTotaleRef.current.toFixed(2),
            source: hardwarePodoActif ? 'hardware' : 'logiciel',
          });
        }
      } else {
        // Cas immobile ou GPS absent sans mouvement : synchroniser le checkpoint pour
        // que le CAS 2 ne re-compte pas des pas déjà écoulés lors de la prochaine activation.
        pasAuDernierCheckpointPodoRef.current = nombrePasActuel;
      }

      if (__DEV__) {
        console.log('[DISTANCE]', {
          total: distanceTotaleRef.current.toFixed(1),
          gpsFiable,
          enMouvementPhysique,
          nombrePasActuel,
          sourcePodometre: hardwarePodoActif ? 'hardware' : 'logiciel',
        });
      }

      const deltaDistanceTick = Math.max(
        distanceTotaleRef.current - distanceAvantAccumulation,
        0,
      );
      const vitesseDistanceMs =
        deltaDistanceTick > 0 ? deltaDistanceTick / deltaTempsTickSecondes : 0;
      const vitessePasMs =
        deltaPasTick > 0
          ? (deltaPasTick * LONGUEUR_PAS_METRES) / deltaTempsTickSecondes
          : 0;
      const vitesseMesureeMs =
        vitesseMs === null || vitesseMs < 0.2
          ? Math.max(vitesseDistanceMs, vitessePasMs) || null
          : vitesseMs;

      // Zone morte abaissée à 0.2 m/s pour laisser vivre la marche lente.
      // Quand le GPS renvoie 0 mais que la distance ou les pas avancent,
      // on retombe sur une vitesse dérivée du déplacement réel du tick courant.
      let vitesseLissee: number | null = null;
      if (
        vitesseMesureeMs !== null &&
        vitesseMesureeMs <= VITESSE_MAX_PLAUSIBLE_MS
      ) {
        filtreVitesse.ajouter(appliquerZoneMorte(vitesseMesureeMs, 0.2));
        vitesseLissee = filtreVitesse.moyenne();
      }

      // Même si le GPS invente une vitesse (multipath), si l'accéléromètre confirme
      // qu'on ne bouge pas physiquement, on force la vitesse à 0. C'est l'approche
      // de Strava : l'accéléromètre est le juge final du mouvement.
      if (!enMouvementConfirme && vitesseLissee !== null) {
        vitesseLissee = 0;
      }

      // Met à jour positionPrecedenteRef à chaque trame (pour le calcul de vitesse Haversine fallback)
      if (dernierePosition) {
        positionPrecedenteRef.current = dernierePosition;
        enregistrerPointTrace(dernierePosition);
      }

      if (__DEV__) {
        console.log('[TRAME]', {
          gpsFiable,
          nombrePasActuel,
          sourcePodometre: hardwarePodoActif ? 'hardware' : 'logiciel',
        });
      }

      const duree = dureeSecondesCourantes();
      const allureMoyenne =
        distanceTotaleRef.current > 10 && duree > 0
          ? duree / (distanceTotaleRef.current / 1000)
          : null;

      // Fenêtre glissante 20s (Strava-style) : allure instantanée fiable sans inverser 1/v
      if (enMouvementPhysique) {
        bufferAllureRef.current.push({timestamp: maintenant, distance: distanceTotaleRef.current});
      }
      bufferAllureRef.current = bufferAllureRef.current.filter(
        e => maintenant - e.timestamp <= 60_000,
      );
      let allureFenetre: number | null = null;
      if (bufferAllureRef.current.length >= 2) {
        const premier = bufferAllureRef.current[0];
        const dernier = bufferAllureRef.current[bufferAllureRef.current.length - 1];
        const deltaT = (dernier.timestamp - premier.timestamp) / 1000;
        const deltaD = dernier.distance - premier.distance;
        if (deltaT >= 5 && deltaD >= 5) {
          allureFenetre = deltaT / (deltaD / 1000);
        }
      }
      if (__DEV__) {
        console.log('[ALLURE]', {
          fenetre: allureFenetre?.toFixed(0) ?? '--',
          bufferSize: bufferAllureRef.current.length,
          moyenne: allureMoyenne?.toFixed(0) ?? '--',
        });
      }

      const allureAffichee = allureFenetre ?? allureMoyenne;

      setEtat({
        latitude: dernierePosition?.latitude ?? null,
        longitude: dernierePosition?.longitude ?? null,
        altitude: dernierePosition?.altitude ?? null,
        precisionGps: dernierePosition?.accuracy ?? null,
        altitudeLissee,
        vitesseMs,
        vitesseKmh: vitesseMs !== null ? msVersKmh(vitesseMs) : null,
        vitesseLissee,
        vitesseLisseeKmh: vitesseLissee !== null ? msVersKmh(vitesseLissee) : null,
        nombrePasSession,
        accelerometre: derniereAccel,
        agitation,
        allureSecParKm: allureAffichee,
        distanceMetres: distanceTotaleRef.current,
        dureeSecondes: Math.round(dureeSecondesCourantes()),
        denivelePositifMetres: denivelePositifRef.current,
        deniveleNegatifMetres: deniveleNegatifRef.current,
        traceParcours: traceParcoursRef.current,
        numeroTrame: trameRef.current,
        erreurs: trameErreurs,
        estActif: true,
        estEnPause: false,
      });
      dernierTickMs = maintenant;
      dernierNombrePasTick = nombrePasActuel;
    }, 500);

    const nettoyer = () => {
      clearInterval(intervalId);
      annulerGPS?.();
      annulerAccel?.();
      annulerPodo?.();
    };

    // Attacher le cleanup AVANT toute souscription async pour que arreter()
    // / pauseReprendre() puissent toujours stopper l'intervalle même si les
    // capteurs ne se sont pas encore inscrits.
    annulerCapteursRef.current = nettoyer;

    // Souscriptions capteurs en arrière-plan (ne bloquent pas l'intervalle UI).
    void (async () => {
      const erreurs: string[] = [];

      // Accéléromètre (synchrone) : 10 lectures/s, alimente le filtre d'agitation
      if (config.capteursActifs.accelerometre) {
        try {
          const sub = souscrireAccelerometre(data => {
            derniereAccel = data;
            const mag = calculerMagnitudeAccel(data);
            filtreAgitation.ajouter(Math.abs(mag));
            pasLogicielsRef.current =
              compteurPasLogicielRef.current.ajouterEchantillon(mag);
            if (__DEV__) {
              console.log('[MAG]', Math.abs(mag).toFixed(3), '| pas:', pasLogicielsRef.current);
            }
          }, 100);
          annulerAccel = sub.annuler;
        } catch {
          erreurs.push('Accéléromètre inaccessible');
        }
      }

      // Podomètre (synchrone)
      if (config.capteursActifs.podometre) {
        try {
          const permPodo = await demanderPermissionPodometre();
          if (!permPodo) {
            erreurs.push("Permission d'activité physique refusée");
          }
        } catch {
          erreurs.push(
            "Impossible de demander la permission d'activité physique",
          );
        }
        try {
          const podoDispo = await verifierDisponibilitePodometre();
          if (!podoDispo) {
            erreurs.push('Podomètre non disponible sur cet appareil');
          }
        } catch {
          erreurs.push('Podomètre inaccessible');
        }
        if (
          !erreurs.includes("Permission d'activité physique refusée") &&
          !erreurs.includes(
            "Impossible de demander la permission d'activité physique",
          ) &&
          !erreurs.includes('Podomètre non disponible sur cet appareil') &&
          !erreurs.includes('Podomètre inaccessible')
        ) {
          try {
            const sub = souscrirePodometre(pas => {
              derniersPasRef.current = pas;
            });
            annulerPodo = sub.annuler;
          } catch {
            erreurs.push('Podomètre inaccessible');
          }
        }
      }

      // GPS : permission puis watchPositionAsync (async)
      if (config.capteursActifs.gps) {
        try {
          const permGPS = await demanderPermissionGPS();
          if (!permGPS) {
            erreurs.push('Permission GPS refusée');
          }
        } catch {
          erreurs.push('Impossible de demander la permission GPS');
        }
        try {
          const sub = await souscrirePositionGPS(
            pos => {
              dernierePosition = pos;
            },
            {timeInterval: 500, distanceInterval: 0},
          );
          // Si le suivi a été arrêté pendant l'init GPS, annuler tout de suite.
          if (annulerCapteursRef.current === nettoyer) {
            annulerGPS = sub.annuler;
          } else {
            sub.annuler();
          }
        } catch {
          erreurs.push('GPS non disponible sur cet appareil');
        }
      }

      if (erreurs.length > 0 && annulerCapteursRef.current === nettoyer) {
        setEtat(prev => ({...prev, erreurs}));
      }
    })();
  }, [config, enregistrerPointTrace, reinitialiserRefsSession]);

  // -- Pause / Reprendre --
  const pauseReprendre = useCallback(() => {
    const estPauseMaintenant = !estEnPauseRef.current;
    estEnPauseRef.current = estPauseMaintenant;

    if (estPauseMaintenant) {
      // Pause : accumuler la durée du segment en cours
      if (heureDebutSegmentRef.current !== null) {
        dureeAccumuleeRef.current +=
          (Date.now() - heureDebutSegmentRef.current) / 1000;
        heureDebutSegmentRef.current = null;
      }
      const pasAvantPause =
        derniersPasRef.current !== null && pasDepartRef.current !== null
          ? derniersPasRef.current - pasDepartRef.current
          : 0;
      pasAccumulesRef.current += pasAvantPause;
      pasDepartRef.current = null;
      // La nouvelle souscription Pedometer post-resume recommence à compter depuis zéro
      // (delta depuis l'inscription, pas cumulatif). On efface l'ancienne valeur pour
      // éviter que pasDepartRef soit initialisé avec une valeur stale au premier tick.
      derniersPasRef.current = null;
      bufferAllureRef.current = [];

      // Arrêter le polling / streaming
      if (simulation) {
        simulRef.current?.arreter();
      } else {
        annulerCapteursRef.current?.();
        annulerCapteursRef.current = null;
      }
      setEtat(prev => ({...prev, estEnPause: true}));
    } else {
      // Reprendre : démarrer un nouveau segment
      heureDebutSegmentRef.current = Date.now();
      if (simulation && simulRef.current) {
        const cb = callbackSimulRef.current;
        if (cb) {
          simulRef.current.demarrer(config.intervalleSondageMs, cb);
        }
      } else if (!simulation) {
        void demarrerCapteurs(false);
      }
      setEtat(prev => ({...prev, estEnPause: false}));
    }
  }, [simulation, config.intervalleSondageMs, demarrerCapteurs]);

  // -- Démarrer / Arrêter --
  const demarrer = useCallback(() => {
    if (simulation) {
      demarrerSimulation();
    } else {
      void demarrerCapteurs();
    }
  }, [simulation, demarrerSimulation, demarrerCapteurs]);

  const arreter = useCallback(() => {
    const dureeFinale = Math.round(dureeSecondesCourantes());
    const distanceFinale = distanceTotaleRef.current;
    const pasFinaux = etat.nombrePasSession ?? 0;
    const vitesseMoy =
      dureeFinale > 0 ? (distanceFinale / dureeFinale) * 3.6 : 0;

    const resume: ResumeSuivi = {
      dureeSecondes: dureeFinale,
      distanceMetres: distanceFinale,
      nombrePas: pasFinaux,
      vitesseMoyenneKmh: vitesseMoy,
      denivelePositifMetres: denivelePositifRef.current,
      deniveleNegatifMetres: deniveleNegatifRef.current,
      traceParcours: traceParcoursRef.current,
    };

    simulRef.current?.arreter();
    simulRef.current = null;
    callbackSimulRef.current = null;
    annulerCapteursRef.current?.();
    annulerCapteursRef.current = null;

    reinitialiserRefsSession();
    setEtat({...ETAT_INITIAL});
    setResumeSession(resume);
  }, [etat.nombrePasSession, reinitialiserRefsSession]);

  const effacerResume = useCallback(() => {
    setResumeSession(null);
  }, []);

  useEffect(() => {
    return () => {
      simulRef.current?.arreter();
      annulerCapteursRef.current?.();
    };
  }, []);

  return {etat, demarrer, arreter, pauseReprendre, resumeSession, effacerResume};
}
