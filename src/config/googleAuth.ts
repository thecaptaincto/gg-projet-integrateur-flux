import Config from 'react-native-config';

/**
 * Configuration Google OAuth
 * Les identifiants sont stockés dans les variables d'environnement (.env)
 * et NON en dur dans le code source pour des raisons de sécurité
 */
export const configurationGoogle = {
  webClientId: Config.GOOGLE_WEB_CLIENT_ID ?? undefined,
  iosClientId: Config.GOOGLE_IOS_CLIENT_ID ?? undefined,
};

/**
 * Vérifie que la configuration Google est complète
 */
export const googleAuthEstConfiguree = (): boolean => {
  const webClientId = configurationGoogle.webClientId?.trim();
  return Boolean(webClientId && webClientId.length > 0);
};
