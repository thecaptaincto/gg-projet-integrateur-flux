const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Sur certains postes Windows, la création de processus (spawn) peut être
  // bloquée (EPERM). Metro-file-map utilise jest-worker pour paralléliser
  // l'indexation des fichiers; forcer 1 worker évite le spawn et empêche
  // un crash interne (500) au bundling.
  maxWorkers: 1,
  resolver: {
    // Sous Windows, on évite Watchman pour rester sur le file watcher natif.
    // Cela réduit les sources de comportement instable sur des postes où
    // les permissions/processus sont déjà capricieux.
    useWatchman: false,
    // Exclure les sous-projets Expo présents dans le repo qui ne font pas
    // partie de cette application React Native CLI. Sans cette exclusion,
    // Metro tente de résoudre leurs dépendances (expo-router, expo-location…)
    // qui ne sont pas installées ici, ce qui provoque un crash interne.
    // Un seul RegExp est plus stable qu'un tableau de patterns lors du merge
    // avec la config Metro par défaut.
    blockList: exclusionList([
      /movement-tracker-corrige[/\\].*/,
      /movement-tracker-expo[/\\].*/,
      /external[/\\].*/,
      /android[/\\]app[/\\]build[/\\].*/,
      /android[/\\]build[/\\].*/,
      /\.gradle[/\\].*/,
    ]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
