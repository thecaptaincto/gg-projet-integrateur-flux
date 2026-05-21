// deviceSensors.ts — Couche d'abstraction pour les capteurs physiques de l'appareil.
// Regroupe les accès à expo-location (GPS), expo-sensors (podomètre + accéléromètre).
// Toutes les fonctions retournent un booléen de disponibilité ou un objet {annuler}
// pour uniformiser l'interface avec simulatedSensors.ts.

import * as Location from 'expo-location';
import {Accelerometer, Pedometer} from 'expo-sensors';
import type {DonneesAccelerometre, PositionGPS} from './types';

// Indique si les capteurs réels sont intégrés dans cette version de l'application.
// Passer à false pour forcer le mode simulation dans toute l'application.
export const CAPTEURS_REELS_DISPONIBLES = true;
export const MESSAGE_CAPTEURS_REELS_INDISPONIBLES =
  "Le suivi avec capteurs reels n'est pas encore integre dans cette version. Utilise le mode simulation pour la demo.";

/**
 * Demande la permission de localisation en premier plan (foreground).
 * La permission en arrière-plan n'est pas requise pour ce cas d'usage.
 *
 * @returns true si la permission est accordée, false sinon
 */
export async function demanderPermissionGPS(): Promise<boolean> {
  const {status} = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Lecture ponctuelle de la position GPS (snapshot, non continu).
 * Retourne null si la permission est refusée ou si le GPS est indisponible.
 */
async function lirePositionGPS(): Promise<PositionGPS | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Souscription continue au GPS via watchPositionAsync.
 * Utilise Accuracy.BestForNavigation (haute précision, consommation batterie accrue).
 * distanceInterval = 0 : déclenche le callback même sans déplacement,
 * ce qui permet de détecter l'immobilité et de mettre à jour l'accuracy.
 *
 * @param callback - Appelé à chaque nouvelle position GPS
 * @param options.timeInterval - Intervalle minimum entre deux mises à jour (ms, défaut 500)
 * @param options.distanceInterval - Distance minimale de déplacement entre deux mises à jour (m, défaut 0)
 * @returns Objet {annuler} pour stopper le watcher
 */
export async function souscrirePositionGPS(
  callback: (position: PositionGPS) => void,
  options?: {timeInterval?: number; distanceInterval?: number},
): Promise<{annuler: () => void}> {
  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: options?.timeInterval ?? 500,
      distanceInterval: options?.distanceInterval ?? 0,
    },
    location => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      });
    },
  );
  return {annuler: () => sub.remove()};
}

/**
 * Vérifie si le podomètre matériel est disponible sur l'appareil.
 * Retourne false sur tablette ou certains émulateurs.
 */
export async function verifierDisponibilitePodometre(): Promise<boolean> {
  return Pedometer.isAvailableAsync();
}

/**
 * Demande la permission d'activité physique (ACTIVITY_RECOGNITION sur Android 10+).
 * Sur iOS, le podomètre ne nécessite pas de permission explicite.
 *
 * @returns true si la permission est accordée, false sinon
 */
export async function demanderPermissionPodometre(): Promise<boolean> {
  const {status} = await Pedometer.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Souscription continue au podomètre matériel.
 * Le callback reçoit le nombre de pas depuis le démarrage de l'abonnement
 * (delta depuis l'inscription, non cumulatif depuis l'allumage de l'appareil).
 *
 * @param callback - Appelé à chaque mise à jour du compteur de pas
 * @returns Objet {annuler} pour stopper l'abonnement
 */
export function souscrirePodometre(
  callback: (nombrePas: number) => void,
): {annuler: () => void} {
  const abonnement = Pedometer.watchStepCount(result => {
    callback(result.steps);
  });
  return {annuler: () => abonnement.remove()};
}

/**
 * Souscription à l'accéléromètre à une fréquence configurable.
 * Les valeurs x/y/z sont en g-force (repos ≈ 0, 0, 1 selon l'orientation).
 *
 * @param callback - Appelé à chaque lecture de l'accéléromètre
 * @param intervalleMs - Période de mise à jour en millisecondes (défaut 1000)
 * @returns Objet {annuler} pour stopper l'abonnement
 */
export function souscrireAccelerometre(
  callback: (donnees: DonneesAccelerometre) => void,
  intervalleMs: number = 1000,
): {annuler: () => void} {
  Accelerometer.setUpdateInterval(intervalleMs);
  const abonnement = Accelerometer.addListener(data => {
    callback({x: data.x, y: data.y, z: data.z});
  });
  return {annuler: () => abonnement.remove()};
}
