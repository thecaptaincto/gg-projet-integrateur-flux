const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Exclure les sous-projets Expo présents dans le repo qui ne font pas
    // partie de cette application React Native CLI. Sans cette exclusion,
    // Metro tente de résoudre leurs dépendances (expo-router, expo-location…)
    // qui ne sont pas installées ici, ce qui provoque un crash interne.
    blockList: [
      // Ces dossiers sont des sous-projets Expo présents dans le repo
      // mais qui ne font pas partie de cette app React Native CLI.
      // Les regex sans slash final matchent les chemins Windows (\) et Unix (/).
      /movement-tracker-corrige/,
      /movement-tracker-expo/,
      /external[/\\].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
