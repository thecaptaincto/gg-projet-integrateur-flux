// ============================================================
// simulatedSensors.ts — Trajectoire simulée pour tests
// Port direct du projet de ton ami (capteurs_simules.py).
// ============================================================

import type {DonneesAccelerometre, PositionGPS} from './types';

// Chaque point : [lat, lon, alt, speed_m_s, pasDelta, ax, ay, az]
const TRAJECTOIRE: [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
][] = [
  // Départ immobile
  [48.8566, 2.3522, 35.0, 0.0, 0, 0.02, 0.01, 9.79],
  [48.8566, 2.3522, 35.0, 0.0, 0, 0.03, 0.02, 9.8],
  [48.8566, 2.3522, 35.0, 0.0, 0, 0.01, 0.01, 9.81],
  // Début de marche lente
  [48.85663, 2.35228, 35.1, 1.1, 1, 0.2, 0.15, 9.65],
  [48.85667, 2.35241, 35.2, 1.2, 1, 0.25, 0.18, 9.6],
  [48.85672, 2.35255, 35.3, 1.3, 2, 0.3, 0.2, 9.55],
  [48.85678, 2.3527, 35.4, 1.4, 2, 0.28, 0.19, 9.58],
  // Accélération
  [48.85686, 2.3529, 35.5, 1.8, 2, 0.4, 0.3, 9.5],
  [48.85697, 2.35315, 35.6, 2.1, 3, 0.5, 0.35, 9.45],
  [48.8571, 2.35342, 35.7, 2.3, 3, 0.55, 0.38, 9.42],
  [48.85725, 2.35372, 35.8, 2.2, 3, 0.52, 0.36, 9.44],
  // Ralentissement
  [48.85737, 2.35398, 35.7, 1.5, 2, 0.3, 0.22, 9.56],
  [48.85746, 2.35418, 35.6, 1.0, 1, 0.2, 0.15, 9.62],
  // Arrêt
  [48.85752, 2.3543, 35.5, 0.0, 0, 0.03, 0.02, 9.79],
  [48.85752, 2.3543, 35.5, 0.0, 0, 0.02, 0.01, 9.8],
];

export class SourceCapteursSimules {
  private index = 0;
  private totalPas = 1200;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private pointCourant() {
    const point = TRAJECTOIRE[this.index % TRAJECTOIRE.length];
    this.index++;
    return point;
  }

  /** Lit une trame simulée (position + accéléromètre + pas) */
  lireTrame(): {
    position: PositionGPS;
    accelerometre: DonneesAccelerometre;
    nombrePasTotal: number;
  } {
    const [lat, lon, alt, speed, pasDelta, ax, ay, az] = this.pointCourant();
    this.totalPas += pasDelta;

    return {
      position: {
        latitude: lat,
        longitude: lon,
        altitude: alt,
        speed,
        timestamp: Date.now(),
      },
      accelerometre: {x: ax, y: ay, z: az},
      nombrePasTotal: this.totalPas,
    };
  }

  /** Démarre la simulation en boucle avec callback */
  demarrer(
    intervalleMs: number,
    callback: (trame: ReturnType<typeof this.lireTrame>) => void,
  ): void {
    this.intervalId = setInterval(() => {
      callback(this.lireTrame());
    }, intervalleMs);
  }

  arreter(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reinitialiser(): void {
    this.index = 0;
    this.totalPas = 1200;
  }
}

