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

const CLE = 'entrainements_v1';

export async function chargerEntrainements(): Promise<EntrainementSauvegarde[]> {
  try {
    const json = await AsyncStorage.getItem(CLE);
    return json ? (JSON.parse(json) as EntrainementSauvegarde[]) : [];
  } catch {
    return [];
  }
}

export async function sauvegarderEntrainement(
  entrainement: Omit<EntrainementSauvegarde, 'id'>,
): Promise<void> {
  const liste = await chargerEntrainements();
  const nouveau: EntrainementSauvegarde = {
    ...entrainement,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  await AsyncStorage.setItem(CLE, JSON.stringify([nouveau, ...liste]));
}

export async function supprimerEntrainement(id: string): Promise<void> {
  const liste = await chargerEntrainements();
  await AsyncStorage.setItem(
    CLE,
    JSON.stringify(liste.filter(e => e.id !== id)),
  );
}
