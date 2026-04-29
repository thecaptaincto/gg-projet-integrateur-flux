import {useCallback, useEffect, useRef, useState} from 'react';
import type {
  ConfigSuivi,
  DonneesAccelerometre,
  EtatSuivi,
  PositionGPS,
  ResumeSuivi,
} from '../sensors/types';
import {CONFIG_DEFAUT} from '../sensors/types';
import {
  demanderPermissionGPS,
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
  creerFiltreMoyenneMobile,
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
};

// Filtre anti-absurde : vitesse maximale plausible (m/s) pour la course.
// 8 m/s ≈ 28.8 km/h. Au-delà, on traite ça comme un saut GPS.
const VITESSE_MAX_PLAUSIBLE_MS = 8;

// Longueur de pas moyenne pour un adulte qui marche (en mètres).
// Valeur utilisée en fallback intérieur quand le GPS est imprécis.
const LONGUEUR_PAS_METRES = 0.7;

export function useSuiviMouvement(options: OptionsHook = {}) {
  const {config = CONFIG_DEFAUT, simulation = false} = options;

  const [etat, setEtat] = useState<EtatSuivi>(ETAT_INITIAL);
  const [resumeSession, setResumeSession] = useState<ResumeSuivi | null>(null);

  // Refs session
  const positionPrecedenteRef = useRef<PositionGPS | null>(null);
  const pasDepartRef = useRef<number | null>(null);
  const trameRef = useRef(0);
  const distanceTotaleRef = useRef(0);
  const heureDebutSegmentRef = useRef<number | null>(null);
  const dureeAccumuleeRef = useRef(0);

  // Refs capteurs
  const simulRef = useRef<SourceCapteursSimules | null>(null);
  const annulerCapteursRef = useRef<null | (() => void)>(null);
  const callbackSimulRef = useRef<
    ((trame: ReturnType<SourceCapteursSimules['lireTrame']>) => void) | null
  >(null);
  const estEnPauseRef = useRef(false);

  // Refs de filtrage GPS (mode capteurs réels)
  const checkpointRef = useRef<PositionGPS | null>(null);
  // Historique glissant des 6 dernières valeurs d'agitation (3 secondes à 500ms/tick).
  // Sert à détecter un mouvement physique soutenu, pas juste un tremblement ponctuel.
  const historiqueAgitationRef = useRef<number[]>([]);
  // Compteur de pas au moment du dernier checkpoint pour calculer le delta de pas
  const pasAuDernierCheckpointRef = useRef<number>(0);

  const dureeSecondesCourantes = () =>
    dureeAccumuleeRef.current +
    (heureDebutSegmentRef.current
      ? (Date.now() - heureDebutSegmentRef.current) / 1000
      : 0);

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
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reinitialiserRefsSession = useCallback(() => {
    positionPrecedenteRef.current = null;
    pasDepartRef.current = null;
    trameRef.current = 0;
    distanceTotaleRef.current = 0;
    dureeAccumuleeRef.current = 0;
    heureDebutSegmentRef.current = null;
    estEnPauseRef.current = false;
    checkpointRef.current = null;
    historiqueAgitationRef.current = [];
    pasAuDernierCheckpointRef.current = 0;
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
  const demarrerCapteurs = useCallback(async () => {
    if (annulerCapteursRef.current) {
      return;
    }
    reinitialiserRefsSession();
    heureDebutSegmentRef.current = Date.now();

    const erreurs: string[] = [];

    if (config.capteursActifs.gps) {
      const permGPS = await demanderPermissionGPS();
      if (!permGPS) {
        erreurs.push('Permission GPS refusée');
      }
    }

    if (config.capteursActifs.podometre) {
      const podoDispo = await verifierDisponibilitePodometre();
      if (!podoDispo) {
        erreurs.push('Podomètre non disponible sur cet appareil');
      }
    }

    let dernierePosition: PositionGPS | null = null;
    let derniereAccel: DonneesAccelerometre | null = null;
    let derniersPas: number | null = null;

    // Filtres de lissage
    const filtreVitesse = creerFiltreMoyenneMobile(5);
    const filtreAltitude = creerFiltreMoyenneMobile(5);
    const filtreAgitation = creerFiltreMoyenneMobile(5);

    // Accéléromètre : 10 lectures/s, alimente aussi le filtre d'agitation
    let annulerAccel: (() => void) | null = null;
    if (config.capteursActifs.accelerometre) {
      const sub = souscrireAccelerometre(data => {
        derniereAccel = data;
        filtreAgitation.ajouter(Math.abs(calculerMagnitudeAccel(data)));
      }, 100);
      annulerAccel = sub.annuler;
    }

    // Podomètre
    let annulerPodo: (() => void) | null = null;
    if (config.capteursActifs.podometre) {
      const sub = souscrirePodometre(pas => {
        derniersPas = pas;
      });
      annulerPodo = sub.annuler;
    }

    // GPS en streaming (watchPositionAsync) au lieu de polling
    let annulerGPS: (() => void) | null = null;
    if (config.capteursActifs.gps) {
      const sub = await souscrirePositionGPS(
        pos => {
          dernierePosition = pos;
        },
        {timeInterval: 500, distanceInterval: 0},
      );
      annulerGPS = sub.annuler;
    }

    // Intervalle UI (500ms) : calcule les valeurs lissées et met à jour l'état
    const intervalId = setInterval(() => {
      const trameErreurs: string[] = [];
      trameRef.current++;

      if (derniersPas !== null && pasDepartRef.current === null) {
        pasDepartRef.current = derniersPas;
      }
      const nombrePasSession =
        derniersPas !== null && pasDepartRef.current !== null
          ? derniersPas - pasDepartRef.current
          : null;

      const vitesseMs = extraireVitesseMs(
        dernierePosition,
        positionPrecedenteRef.current,
        trameErreurs,
      );

      // Zone morte 0.5 m/s pour ignorer le bruit GPS stationnaire (surtout en intérieur)
      let vitesseLissee: number | null = null;
      if (vitesseMs !== null) {
        filtreVitesse.ajouter(appliquerZoneMorte(vitesseMs, 0.5));
        vitesseLissee = filtreVitesse.moyenne();
      }

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

      // "Mouvement physique" = au moins 3 des 6 dernières trames ont agitation > 0.3 m/s²
      // Une vraie marche génère typiquement 1-2 m/s² à chaque pas, bien au-dessus du seuil.
      // 3/6 exige une persistance : un simple coup de vent ou une micro-vibration ne suffit pas.
      const nombreTramesEnMouvement = historiqueAgitationRef.current.filter(
        v => v > 0.3,
      ).length;
      const enMouvementPhysique = nombreTramesEnMouvement >= 3;

      // Même si le GPS invente une vitesse (multipath), si l'accéléromètre confirme
      // qu'on ne bouge pas physiquement, on force la vitesse à 0. C'est l'approche
      // de Strava : l'accéléromètre est le juge final du mouvement.
      if (!enMouvementPhysique && vitesseLissee !== null) {
        vitesseLissee = 0;
      }

      const nombrePasActuel = derniersPas !== null && pasDepartRef.current !== null
        ? derniersPas - pasDepartRef.current
        : 0;

      const gpsFiable =
        dernierePosition !== null &&
        dernierePosition.accuracy !== null &&
        dernierePosition.accuracy <= 15;

      if (gpsFiable && enMouvementPhysique) {
        // CAS 1 : GPS fiable + mouvement → distance via GPS (méthode checkpoint)
        if (checkpointRef.current === null) {
          checkpointRef.current = dernierePosition;
          pasAuDernierCheckpointRef.current = nombrePasActuel;
        } else {
          const deltaDepuisCheckpoint = calculerDistanceMetres(
            checkpointRef.current.latitude,
            checkpointRef.current.longitude,
            dernierePosition!.latitude,
            dernierePosition!.longitude,
          );
          if (deltaDepuisCheckpoint >= 5 && deltaDepuisCheckpoint < 50) {
            distanceTotaleRef.current += deltaDepuisCheckpoint;
            checkpointRef.current = dernierePosition;
            pasAuDernierCheckpointRef.current = nombrePasActuel;
            console.log('[CHECKPOINT GPS]', {
              ajoute: deltaDepuisCheckpoint.toFixed(2),
              total: distanceTotaleRef.current.toFixed(2),
            });
          }
        }
      } else if (enMouvementPhysique && nombrePasActuel > pasAuDernierCheckpointRef.current) {
        // CAS 2 : GPS pas fiable mais pas qui avancent → distance via podomètre
        const nouveauxPas = nombrePasActuel - pasAuDernierCheckpointRef.current;
        const distancePas = nouveauxPas * LONGUEUR_PAS_METRES;
        distanceTotaleRef.current += distancePas;
        pasAuDernierCheckpointRef.current = nombrePasActuel;
        console.log('[CHECKPOINT PAS]', {
          pas: nouveauxPas,
          ajoute: distancePas.toFixed(2),
          total: distanceTotaleRef.current.toFixed(2),
        });
      }

      // Met à jour positionPrecedenteRef à chaque trame (pour le calcul de vitesse Haversine fallback)
      if (dernierePosition) {
        positionPrecedenteRef.current = dernierePosition;
      }

      console.log('[TRAME]', {
        gpsFiable,
        nombrePasActuel,
      });

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
        allureSecParKm: vitesseVersAllure(vitesseLissee),
        distanceMetres: distanceTotaleRef.current,
        dureeSecondes: Math.round(dureeSecondesCourantes()),
        numeroTrame: trameRef.current,
        erreurs: trameErreurs,
        estActif: true,
        estEnPause: false,
      });
    }, 500);

    const nettoyer = () => {
      clearInterval(intervalId);
      annulerGPS?.();
      annulerAccel?.();
      annulerPodo?.();
    };

    annulerCapteursRef.current = nettoyer;
    setEtat(prev => ({...prev, estActif: true, estEnPause: false, erreurs}));
  }, [config, reinitialiserRefsSession]);

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
        void demarrerCapteurs();
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
