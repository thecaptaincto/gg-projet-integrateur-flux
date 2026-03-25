/**
 * @format
 */

// Doit être importé en premier pour que les gestes (swipe, drag) fonctionnent correctement
import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// En mode développement, on supprime tous les avertissements jaunes
// pour ne pas polluer l'écran lors des tests
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

// Enregistrement du composant racine auprès du pont natif React Native
AppRegistry.registerComponent(appName, () => App);
