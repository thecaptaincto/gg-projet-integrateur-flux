import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import messaging, {type RemoteMessage} from '@react-native-firebase/messaging';

import {utiliserAuth} from './ContexteAuth';
import {
  ajouterNotification,
  creerNotificationSysteme,
  creerNotificationDepuisMessage,
  enregistrerPreferenceNotifications,
  lireNotifications,
  lirePreferenceNotifications,
  marquerNotificationCommeLue,
  marquerToutesLesNotificationsCommeLues,
  supprimerToutesLesNotifications,
  type NotificationFlux,
} from '../utils/notifications';
import {
  enregistrerJetonPushUtilisateur,
  supprimerJetonPushUtilisateur,
} from '../utils/jetonsPush';

type ResultatActivationNotifications = {
  actif: boolean;
  permissionAccordee: boolean;
};

type ContexteNotificationsType = {
  notifications: NotificationFlux[];
  notificationsActivees: boolean;
  permissionAccordee: boolean;
  jetonPush: string | null;
  chargement: boolean;
  nombreNonLues: number;
  definirNotificationsActivees: (
    actif: boolean,
  ) => Promise<ResultatActivationNotifications>;
  marquerCommeLue: (id: string) => Promise<void>;
  marquerToutesCommeLues: () => Promise<void>;
  viderNotifications: () => Promise<void>;
  rechargerNotifications: () => Promise<void>;
  ajouterNotificationSysteme: (
    titre: string,
    message: string,
    donnees?: Record<string, string>,
  ) => Promise<void>;
};

const ContexteNotifications = createContext<
  ContexteNotificationsType | undefined
>(undefined);

const permissionIosAccordee = (statut: number) =>
  statut === messaging.AuthorizationStatus.AUTHORIZED ||
  statut === messaging.AuthorizationStatus.PROVISIONAL;

const verifierPermissionAndroidNotifications = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const resultat = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return resultat === PermissionsAndroid.RESULTS.GRANTED;
};

const verifierPermissionAndroidExistante = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
};

export const FournisseurNotifications = ({
  children,
}: {
  children: ReactNode;
}) => {
  const {utilisateur} = utiliserAuth();
  const [notifications, setNotifications] = useState<NotificationFlux[]>([]);
  const [notificationsActivees, setNotificationsActivees] = useState(true);
  const [permissionAccordee, setPermissionAccordee] = useState(false);
  const [jetonPush, setJetonPush] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const dernierUidSynchronise = useRef<string | null>(null);

  const rechargerNotifications = useCallback(async () => {
    const liste = await lireNotifications();
    setNotifications(liste);
  }, []);

  const synchroniserJetonEtPermissions = useCallback(async () => {
    try {
      let permission = true;

      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        const statut = await messaging().hasPermission();
        permission = permissionIosAccordee(statut);
      } else {
        permission = await verifierPermissionAndroidExistante();
      }

      setPermissionAccordee(permission);
      const jeton = await messaging().getToken();
      setJetonPush(jeton);
    } catch (erreur) {
      setJetonPush(null);
      if (__DEV__) {
        console.log('[Flux] Notifications indisponibles:', erreur);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialiser = async () => {
      try {
        const [notificationsChargees, preferenceActivee] = await Promise.all([
          lireNotifications(),
          lirePreferenceNotifications(),
        ]);

        if (!isMounted) {
          return;
        }

        setNotifications(notificationsChargees);
        setNotificationsActivees(preferenceActivee);

        if (preferenceActivee) {
          await synchroniserJetonEtPermissions();
        }
      } finally {
        if (isMounted) {
          setChargement(false);
        }
      }
    };

    void initialiser();

    return () => {
      isMounted = false;
    };
  }, [synchroniserJetonEtPermissions]);

  useEffect(() => {
    const abonnementEtatApp = AppState.addEventListener('change', etat => {
      if (etat === 'active') {
        void rechargerNotifications();
      }
    });

    return () => abonnementEtatApp.remove();
  }, [rechargerNotifications]);

  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!notificationsActivees) {
      return;
    }

    const enregistrerMessage = async (remoteMessage: RemoteMessage) => {
      const notification = creerNotificationDepuisMessage(remoteMessage);
      await ajouterNotification(notification);
      const liste = await lireNotifications();
      setNotifications(liste);
    };

    // ✅ Nettoyer les anciens listeners
    listenersRef.current.forEach(unsub => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    listenersRef.current = [];

    // Ajouter les nouveaux listeners
    listenersRef.current.push(
      messaging().onMessage(remoteMessage => {
        void enregistrerMessage(remoteMessage);
      })
    );

    listenersRef.current.push(
      messaging().onNotificationOpenedApp(remoteMessage => {
        void enregistrerMessage(remoteMessage);
      })
    );

    listenersRef.current.push(
      messaging().onTokenRefresh(nouveauJeton => {
        setJetonPush(nouveauJeton);
      })
    );

    void messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          void enregistrerMessage(remoteMessage);
        }
      });

    return () => {
      listenersRef.current.forEach(unsub => {
        try {
          unsub();
        } catch {
          // ignore
        }
      });
      listenersRef.current = [];
    };
  }, [notificationsActivees]);

  useEffect(() => {
    let annule = false;

    const synchroniserJetonUtilisateur = async () => {
      if (!utilisateur?.uid || !notificationsActivees || !jetonPush) {
        return;
      }

      try {
        await enregistrerJetonPushUtilisateur(utilisateur.uid, jetonPush);
        if (!annule) {
          dernierUidSynchronise.current = utilisateur.uid;
        }
      } catch (erreur) {
        if (__DEV__) {
          console.log('[Flux] Synchronisation du jeton push impossible:', erreur);
        }
      }
    };

    void synchroniserJetonUtilisateur();

    return () => {
      annule = true;
    };
  }, [jetonPush, notificationsActivees, utilisateur?.uid]);

  useEffect(() => {
    let annule = false;

    const nettoyerJetonUtilisateur = async () => {
      const uidACorriger =
        !notificationsActivees && utilisateur?.uid
          ? utilisateur.uid
          : !utilisateur?.uid
            ? dernierUidSynchronise.current
            : dernierUidSynchronise.current !== utilisateur.uid
              ? dernierUidSynchronise.current
              : null;

      if (!uidACorriger) {
        return;
      }

      try {
        await supprimerJetonPushUtilisateur(uidACorriger);
        if (!annule && dernierUidSynchronise.current === uidACorriger) {
          dernierUidSynchronise.current = null;
        }
      } catch (erreur) {
        if (__DEV__) {
          console.log('[Flux] Nettoyage du jeton push impossible:', erreur);
        }
      }
    };

    void nettoyerJetonUtilisateur();

    return () => {
      annule = true;
    };
  }, [notificationsActivees, utilisateur?.uid]);

  const definirNotificationsActivees = useCallback(
    async (actif: boolean): Promise<ResultatActivationNotifications> => {
      if (!actif) {
        setNotificationsActivees(false);
        setPermissionAccordee(false);
        setJetonPush(null);
        await enregistrerPreferenceNotifications(false);
        return {actif: false, permissionAccordee: false};
      }

      let permission = false;

      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        const statut = await messaging().requestPermission();
        permission = permissionIosAccordee(statut);
      } else {
        permission = await verifierPermissionAndroidNotifications();
      }

      if (!permission) {
        setNotificationsActivees(false);
        setPermissionAccordee(false);
        setJetonPush(null);
        await enregistrerPreferenceNotifications(false);
        return {actif: false, permissionAccordee: false};
      }

      setNotificationsActivees(true);
      setPermissionAccordee(true);
      await enregistrerPreferenceNotifications(true);
      await synchroniserJetonEtPermissions();

      return {actif: true, permissionAccordee: true};
    },
    [synchroniserJetonEtPermissions],
  );

  const marquerCommeLue = useCallback(async (id: string) => {
    await marquerNotificationCommeLue(id);
    const liste = await lireNotifications();
    setNotifications(liste);
  }, []);

  const marquerToutesCommeLues = useCallback(async () => {
    await marquerToutesLesNotificationsCommeLues();
    const liste = await lireNotifications();
    setNotifications(liste);
  }, []);

  const viderNotifications = useCallback(async () => {
    await supprimerToutesLesNotifications();
    setNotifications([]);
  }, []);

  const ajouterNotificationSysteme = useCallback(
    async (
      titre: string,
      message: string,
      donnees?: Record<string, string>,
    ) => {
      await ajouterNotification(
        creerNotificationSysteme({
          titre,
          message,
          donnees,
        }),
      );
      const liste = await lireNotifications();
      setNotifications(liste);
    },
    [],
  );

  const valeur = useMemo(
    () => ({
      notifications,
      notificationsActivees,
      permissionAccordee,
      jetonPush,
      chargement,
      nombreNonLues: notifications.filter(notification => !notification.lue)
        .length,
      definirNotificationsActivees,
      marquerCommeLue,
      marquerToutesCommeLues,
      viderNotifications,
      rechargerNotifications,
      ajouterNotificationSysteme,
    }),
    [
      ajouterNotificationSysteme,
      chargement,
      definirNotificationsActivees,
      jetonPush,
      marquerCommeLue,
      marquerToutesCommeLues,
      notifications,
      notificationsActivees,
      permissionAccordee,
      rechargerNotifications,
      viderNotifications,
    ],
  );

  return (
    <ContexteNotifications.Provider value={valeur}>
      {children}
    </ContexteNotifications.Provider>
  );
};

export const utiliserNotifications = () => {
  const contexte = useContext(ContexteNotifications);

  if (!contexte) {
    throw new Error(
      'utiliserNotifications doit être utilisé dans un FournisseurNotifications',
    );
  }

  return contexte;
};
