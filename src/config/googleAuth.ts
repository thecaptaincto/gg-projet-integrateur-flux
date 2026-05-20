// googleAuth.ts — Configuration des identifiants OAuth Google.
// Les valeurs proviennent de react-native-config (fichier .env) avec un fallback
// sur le webClientId public extrait de google-services.json.
// Ne jamais hardcoder des identifiants secrets (client_secret) ici.

import Config from 'react-native-config';

const nettoyerValeur = (valeur: string | undefined): string | undefined => {
  const valeurNettoyee = valeur?.trim();
  return valeurNettoyee ? valeurNettoyee : undefined;
};

/**
 * Configuration Google OAuth
 * Les identifiants sont stockés dans les variables d'environnement (.env)
 * et NON en dur dans le code source pour des raisons de sécurité
 */
// Valeur publique extraite de google-services.json (client_type: 3)
// Utilisée comme fallback si react-native-config ne charge pas le .env
const WEB_CLIENT_ID_FALLBACK =
  '490264637112-spbo924sivuf2oj6f4f58pr39s1obl6e.apps.googleusercontent.com';

export const configurationGoogle = {
  webClientId:
    nettoyerValeur(Config.GOOGLE_WEB_CLIENT_ID) ?? WEB_CLIENT_ID_FALLBACK,
  iosClientId: nettoyerValeur(Config.GOOGLE_IOS_CLIENT_ID),
};

/**
 * Vérifie que la configuration Google est complète
 */
export const googleAuthEstConfiguree = (): boolean => {
  return Boolean(configurationGoogle.webClientId);
};

export const obtenirMessageConfigurationGoogle = (): string => {
  if (googleAuthEstConfiguree()) {
    return '';
  }

  return [
    "La connexion Google n'est pas encore configurée.",
    'Ajoute une valeur valide pour GOOGLE_WEB_CLIENT_ID dans le fichier .env,',
    "puis relance la build Android/iOS pour recharger la configuration native.",
  ].join(' ');
};
