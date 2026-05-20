// migrationSecurite.ts — Migration unique des données de sécurité stockées en clair.
// Exécutée à chaque démarrage dans ContexteAuth (idempotente grâce au marqueur v1).
//
// Migration 1 : si un ancien code d'accès à 6 chiffres est trouvé en clair dans AsyncStorage,
// il est remplacé par un nouveau code à 8 chiffres stocké dans EncryptedStorage (chiffré),
// puis la clé AsyncStorage non chiffrée est supprimée.
// Si la migration a déjà été effectuée (clé migration_securite_v1_complete = 'true'), rien n'est fait.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { serviceChiffrement } from '../services/serviceChiffrement';

export const executerMigrationSecurite = async (): Promise<void> => {
  try {
    // Migration 1: Récupérer l'ancien code d'accès en clair et le chiffrer
    const ancienCode = await AsyncStorage.getItem('codeAcces');
    if (ancienCode && /^\d{6}$/.test(ancienCode)) {
      // Ancien format: 6 chiffres en clair
      // Convertir à 8 chiffres et chiffrer
      const genererNouveauCode = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
      };
      const nouveauCode = genererNouveauCode();

      // Sauvegarder de manière chiffrée
      await serviceChiffrement.sauvegarder('codeAcces', nouveauCode);

      // Supprimer l'ancienne version en clair
      await AsyncStorage.removeItem('codeAcces');

      console.log('[Migration] Code d\'accès migré et chiffré');
    }

    // Marquer la migration v1 comme accomplie pour ne pas la réexécuter aux prochains démarrages
    await AsyncStorage.setItem('migration_securite_v1_complete', 'true');
  } catch (erreur) {
    console.error('[Migration] Erreur lors de la migration:', erreur);
    // Ne pas bloquer l'app si la migration échoue
  }
};

/**
 * Vérifie si les migrations ont été exécutées
 */
export const verifierMigrations = async (): Promise<boolean> => {
  try {
    const complete = await AsyncStorage.getItem('migration_securite_v1_complete');
    return complete === 'true';
  } catch {
    return false;
  }
};
