// ============================================================
// simulatedSensors.ts — Trajectoire simulée pour tests
// Port direct du projet de ton ami (capteurs_simules.py).
// ============================================================

import type {DonneesAccelerometre, PositionGPS} from './types';

// Chaque point : [lat, lon, alt, speed_m_s, pasDelta, ax, ay, az]
// Trajectoire simulée autour du Plateau-Mont-Royal, Montréal
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
  [45.5231, -73.5823, 35.0, 0.0, 0, 0.02, 0.01, 9.79],
  [45.5231, -73.5823, 35.0, 0.0, 0, 0.03, 0.02, 9.8],
  [45.5231, -73.5823, 35.0, 0.0, 0, 0.01, 0.01, 9.81],
  // Début de marche lente
  [45.52313, -73.58218, 35.1, 1.1, 1, 0.2, 0.15, 9.65],
  [45.52317, -73.58205, 35.2, 1.2, 1, 0.25, 0.18, 9.6],
  [45.52322, -73.58191, 35.3, 1.3, 2, 0.3, 0.2, 9.55],
  [45.52328, -73.58176, 35.4, 1.4, 2, 0.28, 0.19, 9.58],
  // Accélération
  [45.52336, -73.58156, 35.5, 1.8, 2, 0.4, 0.3, 9.5],
  [45.52347, -73.58131, 35.6, 2.1, 3, 0.5, 0.35, 9.45],
  [45.5236, -73.58104, 35.7, 2.3, 3, 0.55, 0.38, 9.42],
  [45.52375, -73.58074, 35.8, 2.2, 3, 0.52, 0.36, 9.44],
  // Ralentissement
  [45.52387, -73.58048, 35.7, 1.5, 2, 0.3, 0.22, 9.56],
  [45.52396, -73.58028, 35.6, 1.0, 1, 0.2, 0.15, 9.62],
  // Arrêt
  [45.52402, -73.58016, 35.5, 0.0, 0, 0.03, 0.02, 9.79],
  [45.52402, -73.58016, 35.5, 0.0, 0, 0.02, 0.01, 9.8],
];

export class SourceCapteursSimules {
  private index = 0;
  private totalPas = 0;
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
    this.totalPas = 0;
  }
}

