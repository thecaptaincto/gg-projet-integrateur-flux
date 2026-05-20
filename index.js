/**
 * @format
 */

// index.js — Point d'entrée natif de l'application React Native.
// Configure dans l'ordre :
//   1. react-native-gesture-handler (doit être importé en premier, avant tout autre module)
//   2. Le gestionnaire de messages FCM en arrière-plan (persiste les notifications reçues quand l'app est fermée)
//   3. L'enregistrement du composant racine (App) auprès du pont natif via AppRegistry

// Importé en premier : obligation de react-native-gesture-handler pour que les gestes fonctionnent
import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import {
  ajouterNotification,
  creerNotificationDepuisMessage,
} from './src/utils/notifications';

// En mode développement, on supprime tous les avertissements jaunes
// pour ne pas polluer l'écran lors des tests
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await ajouterNotification(creerNotificationDepuisMessage(remoteMessage));
});

// Enregistrement du composant racine auprès du pont natif React Native
AppRegistry.registerComponent(appName, () => App);
