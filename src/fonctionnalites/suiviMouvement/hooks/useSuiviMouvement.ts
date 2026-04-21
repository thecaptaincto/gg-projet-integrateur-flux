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
  lirePositionGPS,
  souscrireAccelerometre,
  souscrirePodometre,
  verifierDisponibilitePodometre,
} from '../sensors/deviceSensors';
import {SourceCapteursSimules} from '../sensors/simulatedSensors';
import {
  calculerDistanceMetres,
  msVersKmh,
} from '../utils/calculations';

interface OptionsHook {
  config?: ConfigSuivi;
  simulation?: boolean;
}

const ETAT_INITIAL: EtatSuivi = {
  latitude: null,
  longitude: null,
  altitude: null,
  vitesseMs: null,
  vitesseKmh: null,
  nombrePasSession: null,
  accelerometre: null,
  numeroTrame: 0,
  erreurs: [],
  estActif: false,
  estEnPause: false,
  dureeSecondes: 0,
  distanceMetres: 0,
};

// Filtre anti-absurde : vitesse maximale plausible (m/s) pour la course.
// 8 m/s ≈ 28.8 km/h (déjà très rapide). Au-delà, on traite ça comme un saut GPS / simulation trop "grande".
const VITESSE_MAX_PLAUSIBLE_MS = 8;

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

  const dureeSecondesCourantes = () =>
    dureeAccumuleeRef.current +
    (heureDebutSegmentRef.current
      ? (Date.now() - heureDebutSegmentRef.current) / 1000
      : 0);

  const traiterTrame = useCallback(
    (
      position: PositionGPS | null,
      nombrePasTotal: number | null,
      accel: DonneesAccelerometre | null,
    ) => {
      const erreurs: string[] = [];
      trameRef.current++;

      // Pas de session
      if (nombrePasTotal !== null && pasDepartRef.current === null) {
        pasDepartRef.current = nombrePasTotal;
      }
      const nombrePasSession =
        nombrePasTotal !== null && pasDepartRef.current !== null
          ? nombrePasTotal - pasDepartRef.current
          : null;

      // Distance cumulée
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
              vitesseMs = vitesseCapteurOk && vitesseCapteur > 0 ? vitesseCapteur : vitesseHaversine;
            } else if (vitesseCapteurOk) {
              // Coordonnées trop éloignées (GPS jump / simulation). On ajoute une distance basée sur la vitesse capteur.
              distanceTotaleRef.current += vitesseCapteur * dt;
              vitesseMs = vitesseCapteur;
              erreurs.push(
                `Saut GPS filtré (vitesse calculée ${(msVersKmh(vitesseHaversine)).toFixed(1)} km/h)`,
              );
            } else {
              // Aucune info fiable : on ignore ce delta.
              erreurs.push(
                `Point ignoré (vitesse calculée ${(msVersKmh(vitesseHaversine)).toFixed(1)} km/h)`,
              );
              vitesseMs = null;
            }

            // Garder une référence "raisonnable" : on met à jour la position précédente,
            // sauf si le saut est vraiment énorme (évite d'empiler des deltas absurdes).
            const sautEnorme =
              deltaHaversine > 250 || vitesseHaversine > VITESSE_MAX_PLAUSIBLE_MS * 3;
            if (!sautEnorme) {
              positionPrecedenteRef.current = position;
            }
          } else {
            // Timestamp incohérent : conserver la vitesse capteur si dispo.
            if (
              vitesseCapteur !== null &&
              vitesseCapteur <= VITESSE_MAX_PLAUSIBLE_MS
            ) {
              vitesseMs = vitesseCapteur;
            }
          }
        } else {
          // Première position connue : seulement vitesse capteur si dispo
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
        vitesseMs,
        vitesseKmh: vitesseMs !== null ? msVersKmh(vitesseMs) : null,
        nombrePasSession,
        accelerometre: accel,
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

    let annulerAccel: (() => void) | null = null;
    let derniereAccel: DonneesAccelerometre | null = null;
    if (config.capteursActifs.accelerometre) {
      const sub = souscrireAccelerometre(
        data => {
          derniereAccel = data;
        },
        config.intervalleSondageMs,
      );
      annulerAccel = sub.annuler;
    }

    let annulerPodo: (() => void) | null = null;
    let derniersPas: number | null = null;
    if (config.capteursActifs.podometre) {
      const sub = souscrirePodometre(pas => {
        derniersPas = pas;
      });
      annulerPodo = sub.annuler;
    }

    const intervalId = setInterval(async () => {
      let position: PositionGPS | null = null;
      if (config.capteursActifs.gps) {
        position = await lirePositionGPS();
      }
      traiterTrame(position, derniersPas, derniereAccel);
    }, config.intervalleSondageMs);

    const nettoyer = () => {
      clearInterval(intervalId);
      annulerAccel?.();
      annulerPodo?.();
    };

    annulerCapteursRef.current = nettoyer;
    setEtat(prev => ({...prev, estActif: true, estEnPause: false, erreurs}));
  }, [config, reinitialiserRefsSession, traiterTrame]);

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
      // Arrêter le polling
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
    // Calculer le résumé avant réinitialisation
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

    // Arrêter les capteurs
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
