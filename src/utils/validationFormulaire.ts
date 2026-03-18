export const estCourrielValide = (courriel: string): boolean => {
  const courrielNettoye = courriel.trim();
  if (!courrielNettoye) {
    return false;
  }

  // Simple et robuste pour usage client: texte@domaine.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courrielNettoye);
};

export const estMotDePasseValideConnexion = (motDePasse: string): boolean => {
  const texte = motDePasse.trimEnd();
  return texte.length >= 6;
};

export const estMotDePasseValideInscription = (
  motDePasse: string,
): boolean => {
  const texte = motDePasse;
  const a8Caracteres = texte.length >= 8;
  const aUneMajuscule = /[A-Z]/.test(texte);
  const aUnChiffre = /\d/.test(texte);
  return a8Caracteres && aUneMajuscule && aUnChiffre;
};
