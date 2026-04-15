// ============================================================
// deviceSensors.ts — Accès aux capteurs réels
//
// Le projet de ton ami utilisait `expo-location` et `expo-sensors`.
// Ton app actuelle est en React Native CLI (pas Expo), et on n'ajoute
// pas de dépendances natives ici pour éviter de casser le build.
//
// Pour l'instant, ces fonctions sont des stubs "safe".
// On démarre le suivi en mode simulation (fonctionne tout de suite).
// ============================================================

import type {DonneesAccelerometre, PositionGPS} from './types';

export async function demanderPermissionGPS(): Promise<boolean> {
  return false;
}

export async function lirePositionGPS(): Promise<PositionGPS | null> {
  return null;
}

export async function verifierDisponibilitePodometre(): Promise<boolean> {
  return false;
}

export function souscrirePodometre(
  _callback: (nombrePas: number) => void,
): {annuler: () => void} {
  return {annuler: () => {}};
}

export function souscrireAccelerometre(
  _callback: (donnees: DonneesAccelerometre) => void,
  _intervalleMs: number = 1000,
): {annuler: () => void} {
  return {annuler: () => {}};
}

