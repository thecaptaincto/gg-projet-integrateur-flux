const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

function escapePathForRegex(filePath) {
  return filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dossierBloque(relPath) {
  const dossierAbsolu = path.resolve(__dirname, relPath);
  return new RegExp(`^${escapePathForRegex(dossierAbsolu)}[/\\\\].*`);
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Invalide les anciens caches Metro/Haste susceptibles d'etre corrompus
  // sur ce poste Windows et isole le cache de cette app.
  cacheVersion: 'flux-metro-v2',
  // Sur certains postes Windows, la création de processus (spawn) peut être
  // bloquée (EPERM). Metro-file-map utilise jest-worker pour paralléliser
  // l'indexation des fichiers; forcer 1 worker évite le spawn et empêche
  // un crash interne (500) au bundling.
  maxWorkers: 1,
  watcher: {
    // L'auto-sauvegarde du cache Haste peut laisser un état incohérent
    // après une interruption brutale du serveur Metro sur Windows.
    unstable_autoSaveCache: {
      enabled: false,
      debounceMs: 0,
    },
  },
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
      dossierBloque('movement-tracker-corrige'),
      dossierBloque(path.join('external', 'movement-tracker-expo')),
      dossierBloque(path.join('android', 'app', 'build')),
      dossierBloque(path.join('android', 'build')),
      dossierBloque('.gradle'),
      dossierBloque('.gradle-user-home'),
      dossierBloque('.android-home'),
      dossierBloque('.npm-cache'),
      dossierBloque('.pp-tmp'),
      dossierBloque('.tmp'),
      dossierBloque('.userhome'),
    ]),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
