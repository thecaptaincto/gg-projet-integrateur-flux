import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EntrainementSauvegarde {
  id: string;
  nom: string;
  dateISO: string;
  dureeSecondes: number;
  distanceMetres: number;
  nombrePas: number;
  vitesseMoyenneKmh: number;
}

const PREFIXE_CLE_UTILISATEUR = 'entrainements_v2';
const CLE_LEGACY = 'entrainements_v1';

function obtenirCleUtilisateur(uid: string): string {
  return `${PREFIXE_CLE_UTILISATEUR}:${uid}`;
}

function estListeEntrainementsValide(
  valeur: unknown,
): valeur is EntrainementSauvegarde[] {
  return Array.isArray(valeur);
}

export async function chargerEntrainements(
  uid: string | null | undefined,
): Promise<EntrainementSauvegarde[]> {
  if (!uid) {
    return [];
  }
  try {
    const cleUtilisateur = obtenirCleUtilisateur(uid);
    const json = await AsyncStorage.getItem(cleUtilisateur);
    if (json) {
      const donnees = JSON.parse(json) as unknown;
      return estListeEntrainementsValide(donnees) ? donnees : [];
    }

    // Récupère les anciennes sauvegardes locales créées avant l'ajout du stockage par utilisateur.
    const jsonLegacy = await AsyncStorage.getItem(CLE_LEGACY);
    if (!jsonLegacy) {
      return [];
    }

    const donneesLegacy = JSON.parse(jsonLegacy) as unknown;
    if (!estListeEntrainementsValide(donneesLegacy) || donneesLegacy.length === 0) {
      return [];
    }

    await AsyncStorage.setItem(cleUtilisateur, JSON.stringify(donneesLegacy));
    await AsyncStorage.removeItem(CLE_LEGACY);
    return donneesLegacy;
  } catch {
    return [];
  }
}

export async function sauvegarderEntrainement(
  uid: string | null | undefined,
  entrainement: Omit<EntrainementSauvegarde, 'id'>,
): Promise<void> {
  if (!uid) {
    throw new Error("Impossible de sauvegarder sans utilisateur connecté.");
  }
  const liste = await chargerEntrainements(uid);
  const nouveau: EntrainementSauvegarde = {
    ...entrainement,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  await AsyncStorage.setItem(
    obtenirCleUtilisateur(uid),
    JSON.stringify([nouveau, ...liste]),
  );
}

export async function supprimerEntrainement(
  uid: string | null | undefined,
  id: string,
): Promise<void> {
  if (!uid) {
    return;
  }
  const liste = await chargerEntrainements(uid);
  await AsyncStorage.setItem(
    obtenirCleUtilisateur(uid),
    JSON.stringify(liste.filter(e => e.id !== id)),
  );
}

export async function supprimerTousLesEntrainements(
  uid: string | null | undefined,
): Promise<void> {
  if (!uid) {
    return;
  }

  await AsyncStorage.removeItem(obtenirCleUtilisateur(uid));
}
