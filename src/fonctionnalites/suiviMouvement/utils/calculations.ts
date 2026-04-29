// ============================================================
// calculations.ts — Logique de calcul (portable)
// Portée depuis utilitaires.py via le projet Expo de ton ami.
// ============================================================

import type {DonneesAccelerometre, PositionGPS} from '../sensors/types';

const RAYON_TERRE_METRES = 6_371_000.0;

/**
 * Calcule la distance en mètres entre deux points GPS (formule de Haversine).
 */
export function calculerDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));

  return RAYON_TERRE_METRES * c;
}

/**
 * Calcul de vitesse de secours quand le champ speed est absent.
 */
export function calculerVitesseSecours(
  positionPrecedente: PositionGPS | null,
  positionCourante: PositionGPS,
): number | null {
  if (!positionPrecedente) return null;

  const t1 = positionPrecedente.timestamp / 1000;
  const t2 = positionCourante.timestamp / 1000;
  if (t2 <= t1) return null;

  const distance = calculerDistanceMetres(
    positionPrecedente.latitude,
    positionPrecedente.longitude,
    positionCourante.latitude,
    positionCourante.longitude,
  );

  return distance / (t2 - t1);
}

/**
 * Extrait la vitesse en m/s, avec fallback sur le calcul Haversine.
 */
export function extraireVitesseMs(
  positionCourante: PositionGPS | null,
  positionPrecedente: PositionGPS | null,
  erreurs: string[],
): number | null {
  if (!positionCourante) return null;

  // Utiliser le champ speed s'il est disponible
  if (positionCourante.speed !== null && positionCourante.speed >= 0) {
    return positionCourante.speed;
  }

  // Fallback: calcul Haversine entre deux positions
  erreurs.push(
    "Champ 'speed' non disponible, calcul de secours (Haversine) utilisé",
  );
  return calculerVitesseSecours(positionPrecedente, positionCourante);
}

/** Convertit m/s en km/h */
export function msVersKmh(vitesseMs: number): number {
  return vitesseMs * 3.6;
}

/** Moyenne mobile sur les N dernières valeurs. */
export function creerFiltreMoyenneMobile(taille: number): {
  ajouter: (valeur: number) => void;
  moyenne: () => number;
  reinitialiser: () => void;
} {
  const tampon: number[] = [];
  return {
    ajouter(valeur) {
      tampon.push(valeur);
      if (tampon.length > taille) tampon.shift();
    },
    moyenne() {
      if (tampon.length === 0) return 0;
      return tampon.reduce((s, v) => s + v, 0) / tampon.length;
    },
    reinitialiser() {
      tampon.length = 0;
    },
  };
}

/**
 * Magnitude nette de l'accéléromètre (gravité soustraite).
 * expo-sensors retourne les valeurs en g-force (repos ≈ 1.0).
 * On soustrait 1g puis on convertit en m/s².
 */
export function calculerMagnitudeAccel(accel: DonneesAccelerometre): number {
  const magnitudeG = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  return (magnitudeG - 1) * 9.81;
}

/** Retourne 0 si |valeur| < seuil, sinon retourne valeur. */
export function appliquerZoneMorte(valeur: number, seuil: number): number {
  return Math.abs(valeur) < seuil ? 0 : valeur;
}

/** Convertit m/s en secondes par kilomètre. Retourne null si vitesse < 0.5 m/s. */
export function vitesseVersAllure(vitesseMs: number | null): number | null {
  if (vitesseMs === null || vitesseMs < 0.5) return null;
  return 1000 / vitesseMs;
}

/** Formate une allure (sec/km) en "MM:SS". */
export function formaterAllure(allureSecParKm: number | null): string {
  if (allureSecParKm === null) return '--:--';
  const minutes = Math.floor(allureSecParKm / 60);
  const secondes = Math.round(allureSecParKm % 60);
  return `${minutes}:${secondes.toString().padStart(2, '0')}`;
}

/** Formate une distance en mètres : "XXX m" ou "X.XX km". */
export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}
