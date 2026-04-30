import AsyncStorage from '@react-native-async-storage/async-storage';
import type {RemoteMessage} from '@react-native-firebase/messaging';

export type NotificationFlux = {
  id: string;
  titre: string;
  message: string;
  dateISO: string;
  lue: boolean;
  source: 'push' | 'systeme';
  donnees?: Record<string, string>;
};

const CLE_NOTIFICATIONS = 'flux_notifications';
export const CLE_NOTIFICATIONS_ACTIVES = 'notifs_actives';
const LIMITE_NOTIFICATIONS = 50;

type MessageDistant = RemoteMessage;

const genererId = () =>
  `notif-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const creerNotificationDepuisMessage = (
  remoteMessage: MessageDistant,
): NotificationFlux => {
  const donnees = Object.fromEntries(
    Object.entries(remoteMessage.data ?? {}).map(([cle, valeur]) => [
      cle,
      String(valeur),
    ]),
  );

  return {
    id:
      remoteMessage.messageId ??
      donnees.notificationId ??
      donnees.id ??
      genererId(),
    titre:
      remoteMessage.notification?.title ??
      donnees.title ??
      'Nouvelle notification',
    message:
      remoteMessage.notification?.body ??
      donnees.body ??
      donnees.message ??
      'Tu as reçu une nouvelle notification dans Flux.',
    dateISO: new Date().toISOString(),
    lue: false,
    source: 'push',
    donnees: Object.keys(donnees).length > 0 ? donnees : undefined,
  };
};

export const creerNotificationSysteme = ({
  titre,
  message,
  donnees,
}: {
  titre: string;
  message: string;
  donnees?: Record<string, string>;
}): NotificationFlux => ({
  id: genererId(),
  titre,
  message,
  dateISO: new Date().toISOString(),
  lue: false,
  source: 'systeme',
  donnees,
});

const tronquerNotifications = (notifications: NotificationFlux[]) =>
  notifications.slice(0, LIMITE_NOTIFICATIONS);

export const lireNotifications = async (): Promise<NotificationFlux[]> => {
  try {
    const valeur = await AsyncStorage.getItem(CLE_NOTIFICATIONS);
    if (!valeur) {
      return [];
    }

    const notifications = JSON.parse(valeur) as NotificationFlux[];
    if (!Array.isArray(notifications)) {
      return [];
    }

    return notifications;
  } catch {
    return [];
  }
};

export const enregistrerNotifications = async (
  notifications: NotificationFlux[],
) => {
  await AsyncStorage.setItem(
    CLE_NOTIFICATIONS,
    JSON.stringify(tronquerNotifications(notifications)),
  );
};

export const ajouterNotification = async (notification: NotificationFlux) => {
  const notifications = await lireNotifications();
  const sansDoublons = notifications.filter(item => item.id !== notification.id);
  await enregistrerNotifications([notification, ...sansDoublons]);
};

export const marquerNotificationCommeLue = async (id: string) => {
  const notifications = await lireNotifications();
  await enregistrerNotifications(
    notifications.map(notification =>
      notification.id === id ? {...notification, lue: true} : notification,
    ),
  );
};

export const marquerToutesLesNotificationsCommeLues = async () => {
  const notifications = await lireNotifications();
  await enregistrerNotifications(
    notifications.map(notification => ({...notification, lue: true})),
  );
};

export const supprimerToutesLesNotifications = async () => {
  await AsyncStorage.removeItem(CLE_NOTIFICATIONS);
};

export const lirePreferenceNotifications = async () => {
  try {
    const valeur = await AsyncStorage.getItem(CLE_NOTIFICATIONS_ACTIVES);
    return valeur !== 'false';
  } catch {
    return true;
  }
};

export const enregistrerPreferenceNotifications = async (actif: boolean) => {
  await AsyncStorage.setItem(CLE_NOTIFICATIONS_ACTIVES, actif ? 'true' : 'false');
};
