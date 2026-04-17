// ============================================================
// types.ts — Interfaces centrales pour les capteurs
// Porté depuis le projet Expo de ton ami (sans dépendance Expo).
// ============================================================

/** Position GPS brute */
export interface PositionGPS {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null; // m/s, peut être null si non dispo
  timestamp: number; // ms depuis epoch
}

/** Données de l'accéléromètre */
export interface DonneesAccelerometre {
  x: number;
  y: number;
  z: number;
}

/** État complet d'une trame de capteurs */
export interface TrameCapteurs {
  position: PositionGPS | null;
  nombrePasTotal: number | null;
  accelerometre: DonneesAccelerometre | null;
  erreurs: string[];
}

/** Résultat calculé pour l'affichage */
export interface EtatSuivi {
  // Position
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;

  // Mouvement
  vitesseMs: number | null;
  vitesseKmh: number | null;
  nombrePasSession: number | null;

  // Accéléromètre
  accelerometre: DonneesAccelerometre | null;

  // Métadonnées
  numeroTrame: number;
  erreurs: string[];
  estActif: boolean;
  estEnPause: boolean;

  // Statistiques session en cours
  dureeSecondes: number;
  distanceMetres: number;
}

/** Résumé retourné quand une session est arrêtée */
export interface ResumeSuivi {
  dureeSecondes: number;
  distanceMetres: number;
  nombrePas: number;
  vitesseMoyenneKmh: number;
}

/** Configuration du suivi */
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

