/**
 * Utilitaires de validation génériques (formulaires, paramètres, etc.).
 * Ces fonctions sont pures et ne dépendent pas de Firebase ou du stockage local.
 * 
 * NOTE: Préférer estCourrielValide et estMotDePasseValideInscription
 * depuis validationFormulaire.ts pour une source unique de vérité.
 */

export const validerMotDePasse = (mdp: string): boolean =>
  mdp.length >= 8 && /[A-Z]/.test(mdp) && /[0-9]/.test(mdp);

export const validerEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


