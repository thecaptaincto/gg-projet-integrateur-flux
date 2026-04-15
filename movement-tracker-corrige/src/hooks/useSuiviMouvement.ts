// ============================================================
// useSuiviMouvement.ts — Hook principal de suivi en temps réel
// Équivalent de executer_suivi() dans principe.py
// Orchestre les capteurs et calcule l'état à chaque trame
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EtatSuivi,
  PositionGPS,
  DonneesAccelerometre,
  ConfigSuivi,
} from "../sensors/types";
import { CONFIG_DEFAUT } from "../sensors/types";
import {
  demanderPermissionGPS,
  lirePositionGPS,
  souscrirePodometre,
  souscrireAccelerometre,
  verifierDisponibilitePodometre,
  demanderPermissionPodometre,
} from "../sensors/deviceSensors";
import { SourceCapteursSimules } from "../sensors/simulatedSensors";
import { extraireVitesseMs, msVersKmh } from "../utils/calculations";

interface OptionsHook {
  config?: ConfigSuivi;
  simulation?: boolean;
}

export function useSuiviMouvement(options: OptionsHook = {}) {
  const { config = CONFIG_DEFAUT, simulation = false } = options;

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
  const pasDepart = useRef<number | null>(null);
  const trameRef = useRef(0);
  const simulRef = useRef<SourceCapteursSimules | null>(null);

  // Ref pour le nettoyage des capteurs réels (corrige la fuite de ressources)
  const cleanupRef = useRef<(() => void) | null>(null);

  // -- Traitement d'une trame (équivalent de la boucle while dans executer_suivi) --
  const traiterTrame = useCallback(
    (
      position: PositionGPS | null,
      nombrePasTotal: number | null,
      accel: DonneesAccelerometre | null
    ) => {
      const erreurs: string[] = [];
      trameRef.current++;

      // Pas de session (même logique que Python)
      if (nombrePasTotal !== null && pasDepart.current === null) {
        pasDepart.current = nombrePasTotal;
      }
      const nombrePasSession =
        nombrePasTotal !== null && pasDepart.current !== null
          ? nombrePasTotal - pasDepart.current
          : null;

      // Vitesse avec fallback Haversine
      const vitesseMs = extraireVitesseMs(
        position,
        positionPrecedenteRef.current,
        erreurs
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
    []
  );

  // -- Mode simulation --
  const demarrerSimulation = useCallback(() => {
    const simul = new SourceCapteursSimules();
    simulRef.current = simul;

    simul.demarrer(config.intervalleSondageMs, (trame) => {
      traiterTrame(
        trame.position,
        trame.nombrePasTotal,
        trame.accelerometre
      );
    });

    setEtat((prev) => ({ ...prev, estActif: true }));
  }, [config.intervalleSondageMs, traiterTrame]);

  // -- Mode capteurs réels --
  const demarrerCapteurs = useCallback(async (): Promise<() => void> => {
    const erreurs: string[] = [];

    // Permission GPS
    if (config.capteursActifs.gps) {
      const permGPS = await demanderPermissionGPS();
      if (!permGPS) {
        erreurs.push("Permission GPS refusée");
      }
    }

    // Permission + disponibilité podomètre
    if (config.capteursActifs.podometre) {
      const podoDispo = await verifierDisponibilitePodometre();
      if (!podoDispo) {
        erreurs.push("Podomètre non disponible sur cet appareil");
      } else {
        const permPodo = await demanderPermissionPodometre();
        if (!permPodo) {
          erreurs.push("Permission podomètre (activité physique) refusée");
        }
      }
    }

    if (erreurs.length > 0) {
      setEtat((prev) => ({ ...prev, erreurs }));
    }

    // Souscrire à l'accéléromètre
    let annulerAccel: (() => void) | null = null;
    let derniereAccel: DonneesAccelerometre | null = null;
    if (config.capteursActifs.accelerometre) {
      const sub = souscrireAccelerometre((data) => {
        derniereAccel = data;
      }, config.intervalleSondageMs);
      annulerAccel = sub.annuler;
    }

    // Souscrire au podomètre
    let annulerPodo: (() => void) | null = null;
    let derniersPas: number | null = null;
    if (config.capteursActifs.podometre) {
      const sub = souscrirePodometre((pas) => {
        derniersPas = pas;
      });
      annulerPodo = sub.annuler;
    }

    // Boucle GPS non-chevauchante : utilise setTimeout récursif
    // au lieu de setInterval pour éviter l'empilement d'appels
    // quand getCurrentPositionAsync est lent.
    let actif = true;

    async function boucleSondage() {
      if (!actif) return;

      let position: PositionGPS | null = null;
      if (config.capteursActifs.gps) {
        position = await lirePositionGPS();
      }
      traiterTrame(position, derniersPas, derniereAccel);

      if (actif) {
        setTimeout(boucleSondage, config.intervalleSondageMs);
      }
    }

    boucleSondage();

    setEtat((prev) => ({ ...prev, estActif: true }));

    // Retourner la fonction de nettoyage complète
    return () => {
      actif = false;
      annulerAccel?.();
      annulerPodo?.();
    };
  }, [config, traiterTrame]);

  // -- Démarrer / Arrêter --
  const demarrer = useCallback(async () => {
    if (simulation) {
      demarrerSimulation();
    } else {
      const cleanup = await demarrerCapteurs();
      cleanupRef.current = cleanup;
    }
  }, [simulation, demarrerSimulation, demarrerCapteurs]);

  const arreter = useCallback(() => {
    // Nettoyage simulation
    if (simulRef.current) {
      simulRef.current.arreter();
      simulRef.current = null;
    }

    // Nettoyage capteurs réels (GPS, accéléromètre, podomètre)
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Réinitialiser les refs de session
    positionPrecedenteRef.current = null;
    pasDepart.current = null;
    trameRef.current = 0;

    setEtat({
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
  }, []);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      simulRef.current?.arreter();
      cleanupRef.current?.();
    };
  }, []);

  return { etat, demarrer, arreter };
}
