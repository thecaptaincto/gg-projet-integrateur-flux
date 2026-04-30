/**
 * @format
 */

// Doit être importé en premier pour que les gestes (swipe, drag) fonctionnent correctement
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
