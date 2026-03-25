// Utilitaires de validation génériques (formulaires, paramètres, etc.).
// Ces fonctions sont pures et ne dépendent pas de Firebase ou du stockage local.

export const validerMotDePasse = (mdp: string): boolean =>
  mdp.length >= 8 && /[A-Z]/.test(mdp) && /[0-9]/.test(mdp);

export const validerEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

