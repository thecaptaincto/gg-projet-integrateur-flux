const ID_CLIENT_WEB =
  '490264637112-spbo924sivuf2oj6f4f58pr39s1obl6e.apps.googleusercontent.com';

export const configurationGoogle = {
  webClientId: ID_CLIENT_WEB,
  iosClientId: undefined as string | undefined,
};

export const googleAuthEstConfiguree = () =>
  Boolean(configurationGoogle.webClientId.trim());
