/**
 * Service de rate-limiting pour protéger contre les attaques par force brute
 */

interface LimiteurTentative {
  nombreTentatives: number;
  derniereTentative: number;
  verrouillageJusqu: number;
}

class ServiceRateLimiting {
  private limiteurs = new Map<string, LimiteurTentative>();

  /**
   * Vérifie si une action est autorisée selon la clé
   * @param cle - Clé unique (ex: email, uid)
   * @param maxTentatives - Nombre max de tentatives avant verrouillage
   * @param fenetreMs - Fenêtre de temps en ms
   * @param delaiBaseMs - Délai de base entre tentatives
   * @returns true si action autorisée
   */
  verifier(
    cle: string,
    maxTentatives: number = 5,
    fenetreMs: number = 3600000, // 1 heure
    delaiBaseMs: number = 1000, // 1 seconde
  ): boolean {
    const maintenant = Date.now();
    let limiteur = this.limiteurs.get(cle);

    // Vérifier si le verrouillage a expiré
    if (limiteur?.verrouillageJusqu && maintenant > limiteur.verrouillageJusqu) {
      this.limiteurs.delete(cle);
      limiteur = undefined;
    }

    // Réinitialiser si en dehors de la fenêtre
    if (limiteur && maintenant - limiteur.derniereTentative > fenetreMs) {
      this.limiteurs.delete(cle);
      limiteur = undefined;
    }

    if (!limiteur) {
      this.limiteurs.set(cle, {
        nombreTentatives: 1,
        derniereTentative: maintenant,
        verrouillageJusqu: 0,
      });
      return true;
    }

    // Vérifier si verrouillé
    if (limiteur.verrouillageJusqu > maintenant) {
      return false;
    }

    limiteur.nombreTentatives++;
    limiteur.derniereTentative = maintenant;

    // Appliquer verrouillage si dépassé
    if (limiteur.nombreTentatives > maxTentatives) {
      const delai = delaiBaseMs * Math.pow(2, limiteur.nombreTentatives - maxTentatives - 1);
      limiteur.verrouillageJusqu = maintenant + Math.min(delai, 3600000); // Max 1 heure
      return false;
    }

    return true;
  }

  /**
   * Obtient le temps d'attente restant en ms
   */
  obtenirDelaiAttente(cle: string): number {
    const limiteur = this.limiteurs.get(cle);
    if (!limiteur?.verrouillageJusqu) return 0;

    const attente = limiteur.verrouillageJusqu - Date.now();
    return attente > 0 ? attente : 0;
  }

  /**
   * Réinitialise le compteur pour une clé
   */
  reinitialiser(cle: string): void {
    this.limiteurs.delete(cle);
  }

  /**
   * Réinitialise tous les compteurs
   */
  reinitialiserTous(): void {
    this.limiteurs.clear();
  }
}

export const serviceRateLimiting = new ServiceRateLimiting();
