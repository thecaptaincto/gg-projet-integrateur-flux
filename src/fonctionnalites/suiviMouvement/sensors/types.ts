// ============================================================
// types.ts — Interfaces centrales pour les capteurs et l'état de session.
// Définit les contrats de données entre deviceSensors, simulatedSensors,
// useSuiviMouvement et les composants d'affichage.
// ============================================================

/** Position GPS brute telle que retournée par expo-location. */
export interface PositionGPS {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null; // m/s, peut être null si non dispo
  accuracy: number | null; // Précision horizontale en mètres (null si inconnue)
  timestamp: number; // ms depuis epoch
}

/** Point minimal enregistré dans la trace du parcours. */
export interface PointTrace {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
}

/** Données brutes de l'accéléromètre (axes x/y/z en g-force). */
export interface DonneesAccelerometre {
  x: number;
  y: number;
  z: number;
}


/** État complet exposé par useSuiviMouvement à chaque tick de 500 ms. */
export interface EtatSuivi {
  // Position
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  precisionGps: number | null;

  // Mouvement
  vitesseMs: number | null;
  vitesseKmh: number | null;
  nombrePasSession: number | null;

  // Accéléromètre
  accelerometre: DonneesAccelerometre | null;

  // Valeurs lissées / filtrées
  vitesseLissee: number | null;
  vitesseLisseeKmh: number | null;
  altitudeLissee: number | null;
  agitation: number | null;
  allureSecParKm: number | null;

  // Métadonnées
  numeroTrame: number;
  erreurs: string[];
  estActif: boolean;
  estEnPause: boolean;

  // Statistiques session en cours
  dureeSecondes: number;
  distanceMetres: number;
  denivelePositifMetres: number;
  deniveleNegatifMetres: number;
  traceParcours: PointTrace[];
}

/** Résumé retourné par arreter() à la fin d'une session. */
export interface ResumeSuivi {
  dureeSecondes: number;
  distanceMetres: number;
  nombrePas: number;
  vitesseMoyenneKmh: number;
  denivelePositifMetres: number;
  deniveleNegatifMetres: number;
  traceParcours: PointTrace[];
}

/** Configuration des capteurs et de l'intervalle de sondage. */
export interface ConfigSuivi {
  intervalleSondageMs: number;
  capteursActifs: {
    gps: boolean;
    podometre: boolean;
    accelerometre: boolean;
  };
}

export const CONFIG_DEFAUT: ConfigSuivi = {
  intervalleSondageMs: 1000,
  capteursActifs: {
    gps: true,
    podometre: true,
    accelerometre: true,
  },
};
