import * as Location from 'expo-location';
import {Accelerometer, Pedometer} from 'expo-sensors';
import type {DonneesAccelerometre, PositionGPS} from './types';

export const CAPTEURS_REELS_DISPONIBLES = false;
export const MESSAGE_CAPTEURS_REELS_INDISPONIBLES =
  "Le suivi avec capteurs reels n'est pas encore integre dans cette version. Utilise le mode simulation pour la demo.";

export async function demanderPermissionGPS(): Promise<boolean> {
  const {status} = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function lirePositionGPS(): Promise<PositionGPS | null> {
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

export async function verifierDisponibilitePodometre(): Promise<boolean> {
  return Pedometer.isAvailableAsync();
}

export function souscrirePodometre(
  callback: (nombrePas: number) => void,
): {annuler: () => void} {
  const abonnement = Pedometer.watchStepCount(result => {
    callback(result.steps);
  });
  return {annuler: () => abonnement.remove()};
}

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
