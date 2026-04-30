/**
 * Service de chiffrement des données sensibles
 * Utilise EncryptedStorage pour le stockage sécurisé
 */

import EncryptedStorage from 'react-native-encrypted-storage';

class ServiceChiffrement {
  /**
   * Chiffre et stocke une valeur sensible
   */
  async sauvegarder(cle: string, valeur: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(cle, valeur);
    } catch (erreur) {
      console.error(`Erreur chiffrement ${cle}:`, erreur);
      throw new Error('Impossible de sauvegarder les données sensibles');
    }
  }

  /**
   * Récupère et déchiffre une valeur
   */
  async charger(cle: string): Promise<string | null> {
    try {
      const valeur = await EncryptedStorage.getItem(cle);
      return valeur;
    } catch (erreur) {
      console.error(`Erreur déchiffrement ${cle}:`, erreur);
      return null;
    }
  }

  /**
   * Supprime une valeur sensible
   */
  async supprimer(cle: string): Promise<void> {
    try {
      await EncryptedStorage.removeItem(cle);
    } catch (erreur) {
      console.error(`Erreur suppression ${cle}:`, erreur);
    }
  }

  /**
   * Chiffre et stocke un objet JSON
   */
  async sauvegarderObjet<T>(cle: string, objet: T): Promise<void> {
    const json = JSON.stringify(objet);
    await this.sauvegarder(cle, json);
  }

  /**
   * Récupère et déchiffre un objet JSON
   */
  async chargerObjet<T>(cle: string): Promise<T | null> {
    const json = await this.charger(cle);
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }
}

export const serviceChiffrement = new ServiceChiffrement();
