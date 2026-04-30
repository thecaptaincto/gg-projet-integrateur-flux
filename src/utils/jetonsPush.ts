import firestore from '@react-native-firebase/firestore';
import {Platform} from 'react-native';

const COLLECTION_UTILISATEURS = 'utilisateurs';

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
        jetonPushMisAJourLe: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
};

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
