// jetonsPush.ts — Gestion des jetons FCM (Firebase Cloud Messaging) dans Firestore.
// Chaque utilisateur connecté dispose d'un document dans la collection "utilisateurs".
// Ce document stocke le jeton push actuel, la plateforme (ios/android) et le statut
// des notifications. Le serveur FCM utilise ces données pour envoyer des notifications ciblées.

import firestore from '@react-native-firebase/firestore';
import {Platform} from 'react-native';

const COLLECTION_UTILISATEURS = 'utilisateurs';

// Enregistre ou met à jour le jeton FCM de l'utilisateur dans Firestore.
// {merge: true} préserve les autres champs du document (ex: nom, courriel).
export const enregistrerJetonPushUtilisateur = async (
  uid: string,
  jetonPush: string,
) => {
  await firestore()
    .collection(COLLECTION_UTILISATEURS)
    .doc(uid)
    .set(
      {
        jetonPush,
        notificationsActivees: true,
        plateformePush: Platform.OS,
        // serverTimestamp() est résolu côté serveur pour éviter les décalages d'horloge
        jetonPushMisAJourLe: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
};

// Supprime le jeton FCM du document utilisateur quand les notifications sont désactivées.
// FieldValue.delete() efface le champ sans supprimer tout le document.
export const supprimerJetonPushUtilisateur = async (uid: string) => {
  await firestore()
    .collection(COLLECTION_UTILISATEURS)
    .doc(uid)
    .set(
      {
        notificationsActivees: false,
        jetonPush: firestore.FieldValue.delete(),
        plateformePush: firestore.FieldValue.delete(),
        jetonPushMisAJourLe: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
};

// Supprime entièrement le document Firestore de l'utilisateur.
// Appelé lors de la suppression de compte pour ne pas laisser de données orphelines.
export const supprimerDocumentUtilisateur = async (uid: string) => {
  await firestore().collection(COLLECTION_UTILISATEURS).doc(uid).delete();
};
