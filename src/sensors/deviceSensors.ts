// ============================================================
// deviceSensors.ts — Accès aux capteurs réels du téléphone
// Remplace capteurs_termux.py (subprocess termux-location/sensor)
// Utilise expo-location et expo-sensors
// ============================================================

import * as Location from "expo-location";
import { Accelerometer, Pedometer } from "expo-sensors";
import type { PositionGPS, DonneesAccelerometre } from "./types";

// ---- GPS (remplace termux-location) ----

export async function demanderPermissionGPS(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function lirePositionGPS(): Promise<PositionGPS | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      speed: loc.coords.speed,
      timestamp: loc.timestamp,
    };
  } catch {
    return null;
  }
}

// ---- Podomètre (remplace termux-sensor TYPE_STEP_COUNTER) ----

export async function verifierDisponibilitePodometre(): Promise<boolean> {
  return Pedometer.isAvailableAsync();
}

/**
 * Demande la permission d'accéder au podomètre (ACTIVITY_RECOGNITION sur Android 10+).
 */
export async function demanderPermissionPodometre(): Promise<boolean> {
  const { status } = await Pedometer.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Souscrit au compteur de pas en temps réel.
 * Retourne une fonction pour annuler l'abonnement.
 */
export function souscrirePodometre(
  callback: (nombrePas: number) => void
): { annuler: () => void } {
  const abonnement = Pedometer.watchStepCount((result) => {
    callback(result.steps);
  });

  return {
    annuler: () => abonnement.remove(),
  };
}

// ---- Accéléromètre (remplace termux-sensor TYPE_ACCELEROMETER) ----

export function souscrireAccelerometre(
  callback: (donnees: DonneesAccelerometre) => void,
  intervalleMs: number = 1000
): { annuler: () => void } {
  Accelerometer.setUpdateInterval(intervalleMs);

  const abonnement = Accelerometer.addListener((data) => {
    callback({ x: data.x, y: data.y, z: data.z });
  });

  return {
    annuler: () => abonnement.remove(),
  };
}
