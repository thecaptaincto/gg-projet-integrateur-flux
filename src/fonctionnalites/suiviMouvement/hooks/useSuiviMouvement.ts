// ============================================================
// useSuiviMouvement.ts — Hook principal de suivi en temps réel
// Porté depuis le projet Expo de ton ami, avec un fix important :
// on garde une ref de "cleanup" pour vraiment arreter le polling.
// ============================================================

import {useCallback, useEffect, useRef, useState} from 'react';
import type {
  ConfigSuivi,
  DonneesAccelerometre,
  EtatSuivi,
  PositionGPS,
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
import {extraireVitesseMs, msVersKmh} from '../utils/calculations';

interface OptionsHook {
  config?: ConfigSuivi;
  simulation?: boolean;
}

export function useSuiviMouvement(options: OptionsHook = {}) {
  const {config = CONFIG_DEFAUT, simulation = false} = options;

  // -- État principal (ce qui s'affiche) --
  const [etat, setEtat] = useState<EtatSuivi>({
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
  });

  // -- Refs pour les valeurs entre les trames --
  const positionPrecedenteRef = useRef<PositionGPS | null>(null);
  const pasDepartRef = useRef<number | null>(null);
  const trameRef = useRef(0);
  const simulRef = useRef<SourceCapteursSimules | null>(null);
  const annulerCapteursRef = useRef<null | (() => void)>(null);

  // -- Traitement d'une trame --
  const traiterTrame = useCallback(
    (
      position: PositionGPS | null,
      nombrePasTotal: number | null,
      accel: DonneesAccelerometre | null,
    ) => {
      const erreurs: string[] = [];
      trameRef.current++;

      // Pas de session (meme logique que Python)
      if (nombrePasTotal !== null && pasDepartRef.current === null) {
        pasDepartRef.current = nombrePasTotal;
      }
      const nombrePasSession =
        nombrePasTotal !== null && pasDepartRef.current !== null
          ? nombrePasTotal - pasDepartRef.current
          : null;

      // Vitesse avec fallback Haversine
      const vitesseMs = extraireVitesseMs(
        position,
        positionPrecedenteRef.current,
        erreurs,
      );

      if (position) {
        positionPrecedenteRef.current = position;
      }

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
      });
    },
    [],
  );

  const reinitialiserRefsSession = useCallback(() => {
    positionPrecedenteRef.current = null;
    pasDepartRef.current = null;
    trameRef.current = 0;
  }, []);

  // -- Mode simulation --
  const demarrerSimulation = useCallback(() => {
    if (simulRef.current) {
      return;
    }
    reinitialiserRefsSession();

    const simul = new SourceCapteursSimules();
    simulRef.current = simul;

    simul.demarrer(config.intervalleSondageMs, trame => {
      traiterTrame(trame.position, trame.nombrePasTotal, trame.accelerometre);
    });

    setEtat(prev => ({...prev, estActif: true, erreurs: []}));
  }, [config.intervalleSondageMs, reinitialiserRefsSession, traiterTrame]);

  // -- Mode capteurs réels --
  const demarrerCapteurs = useCallback(async () => {
    if (annulerCapteursRef.current) {
      return;
    }
    reinitialiserRefsSession();

    const erreurs: string[] = [];

    // Permission GPS
    if (config.capteursActifs.gps) {
      const permGPS = await demanderPermissionGPS();
      if (!permGPS) {
        erreurs.push('Permission GPS refusée');
      }
    }

    // Verifier podometre
    if (config.capteursActifs.podometre) {
      const podoDispo = await verifierDisponibilitePodometre();
      if (!podoDispo) {
        erreurs.push('Podomètre non disponible sur cet appareil');
      }
    }

    // Souscrire a l'accelerometre
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

    // Souscrire au podometre
    let annulerPodo: (() => void) | null = null;
    let derniersPas: number | null = null;
    if (config.capteursActifs.podometre) {
      const sub = souscrirePodometre(pas => {
        derniersPas = pas;
      });
      annulerPodo = sub.annuler;
    }

    // Boucle de sondage GPS
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
    setEtat(prev => ({...prev, estActif: true, erreurs}));
  }, [config, reinitialiserRefsSession, traiterTrame]);

  // -- Demarrer / Arreter --
  const demarrer = useCallback(() => {
    if (simulation) {
      demarrerSimulation();
    } else {
      void demarrerCapteurs();
    }
  }, [simulation, demarrerSimulation, demarrerCapteurs]);

  const arreter = useCallback(() => {
    simulRef.current?.arreter();
    simulRef.current = null;

    annulerCapteursRef.current?.();
    annulerCapteursRef.current = null;

    setEtat(prev => ({...prev, estActif: false}));
  }, []);

  // Nettoyage a la destruction du composant
  useEffect(() => {
    return () => {
      arreter();
    };
  }, [arreter]);

  return {etat, demarrer, arreter};
}
