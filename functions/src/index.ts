import {onRequest} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';
import {getMessaging} from 'firebase-admin/messaging';

initializeApp();

type CorpsNotificationTest = {
  uid?: string;
  titre?: string;
  message?: string;
  donnees?: Record<string, unknown>;
};

const COLLECTION_UTILISATEURS = 'utilisateurs';

const normaliserDonnees = (donnees?: Record<string, unknown>) => {
  if (!donnees) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(donnees).map(([cle, valeur]) => [cle, String(valeur)]),
  );
};

export const envoyerNotificationTest = onRequest(
  {region: 'northamerica-northeast1', cors: true},
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({erreur: 'Utilise une requete POST.'});
      return;
    }

    const {uid, titre, message, donnees} = (req.body ?? {}) as CorpsNotificationTest;

    if (!uid) {
      res.status(400).json({erreur: 'Le champ uid est obligatoire.'});
      return;
    }

    const docRef = getFirestore()
      .collection(COLLECTION_UTILISATEURS)
      .doc(uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      res.status(404).json({erreur: `Aucun document utilisateur pour uid=${uid}.`});
      return;
    }

    const utilisateur = snapshot.data();
    const jetonPush = utilisateur?.jetonPush;

    if (typeof jetonPush !== 'string' || !jetonPush.trim()) {
      res.status(404).json({
        erreur: `Aucun jeton push enregistre pour uid=${uid}.`,
      });
      return;
    }

    try {
      const messageId = await getMessaging().send({
        token: jetonPush,
        notification: {
          title: titre ?? 'Notification de test',
          body: message ?? 'Flux a bien envoye une notification Firebase.',
        },
        data: normaliserDonnees(donnees),
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      await docRef.set(
        {
          derniereNotificationTest: {
            titre: titre ?? 'Notification de test',
            message:
              message ?? 'Flux a bien envoye une notification Firebase.',
            envoyeeLe: FieldValue.serverTimestamp(),
            messageId,
          },
        },
        {merge: true},
      );

      res.status(200).json({
        succes: true,
        uid,
        messageId,
      });
    } catch (erreur: any) {
      const codeErreur = erreur?.code as string | undefined;

      if (
        codeErreur === 'messaging/registration-token-not-registered' ||
        codeErreur === 'messaging/invalid-registration-token'
      ) {
        await docRef.set(
          {
            notificationsActivees: false,
            jetonPush: FieldValue.delete(),
            plateformePush: FieldValue.delete(),
            jetonPushMisAJourLe: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }

      res.status(500).json({
        succes: false,
        erreur: erreur?.message ?? 'Envoi impossible.',
        code: codeErreur ?? null,
      });
    }
  },
);
