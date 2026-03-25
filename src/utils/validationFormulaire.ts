// Utilitaires de validation des formulaires d'authentification.
// Ces fonctions sont pures (sans effets de bord) et réutilisables dans
// tous les écrans qui collectent des données utilisateur.

export const estCourrielValide = (courriel: string): boolean => {
  const courrielNettoye = courriel.trim();
  if (!courrielNettoye) {
    return false;
  }

  // Simple et robuste pour usage client: texte@domaine.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courrielNettoye);
};

// Règle allégée pour la connexion : 6 caractères suffisent,
// car l'utilisateur a déjà créé son mot de passe selon des critères plus stricts
export const estMotDePasseValideConnexion = (motDePasse: string): boolean => {
  const texte = motDePasse.trimEnd();
  return texte.length >= 6;
};

// Règle renforcée pour l'inscription : au moins 8 caractères,
// une majuscule et un chiffre pour garantir une sécurité minimale
export const estMotDePasseValideInscription = (
  motDePasse: string,
): boolean => {
  const texte = motDePasse;
  const a8Caracteres = texte.length >= 8;
  const aUneMajuscule = /[A-Z]/.test(texte);
  const aUnChiffre = /\d/.test(texte);
  return a8Caracteres && aUneMajuscule && aUnChiffre;
};
