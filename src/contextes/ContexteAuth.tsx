import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ContexteAuthType {
  utilisateur: FirebaseAuthTypes.User | null;
  chargement: boolean;
  premierLancement: boolean;
  inscrire: (email: string, motDePasse: string, nom: string) => Promise<void>;
  seConnecter: (email: string, motDePasse: string) => Promise<void>;
  seConnecterAvecGoogle: () => Promise<void>;
  seDeconnecter: () => Promise<void>;
  reinitialiserMotDePasse: (email: string) => Promise<void>;
  completerPremierLancement: () => Promise<void>;
  genererCodeAcces: () => Promise<string>;
}

const ContexteAuth = createContext<ContexteAuthType | undefined>(undefined);

export const FournisseurAuth = ({ children }: { children: ReactNode }) => {
  const [utilisateur, setUtilisateur] = useState<FirebaseAuthTypes.User | null>(null);
  const [chargement, setChargement] = useState(true);
  const [premierLancement, setPremierLancement] = useState(true);

  useEffect(() => {
    const desabonner = auth().onAuthStateChanged((user) => {
      setUtilisateur(user);
      setChargement(false);
    });

    const verifierPremierLancement = async () => {
      const valeur = await AsyncStorage.getItem('premierLancement');
      setPremierLancement(valeur === null);
    };
    
    verifierPremierLancement();

    return desabonner;
  }, []);

  const inscrire = async (email: string, motDePasse: string, nom: string) => {
    try {
      setChargement(true);
      
      // Validation
      if (!email.includes('@')) {
        throw new Error('Adresse courriel invalide');
      }
      if (motDePasse.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }
      if (nom.trim().length < 2) {
        throw new Error('Le nom doit contenir au moins 2 caractères');
      }

      // Créer l'utilisateur
      const credential = await auth().createUserWithEmailAndPassword(email, motDePasse);
      
      // Mettre à jour le profil
      await credential.user.updateProfile({
        displayName: nom,
      });

      // Envoyer email de vérification
      await credential.user.sendEmailVerification();

      Alert.alert(
        'Inscription réussie!',
        'Un email de vérification a été envoyé à ' + email
      );
    } catch (erreur: any) {
      let message = 'Erreur lors de l\'inscription';
      
      if (erreur.code === 'auth/email-already-in-use') {
        message = 'Cette adresse courriel est déjà utilisée';
      } else if (erreur.code === 'auth/invalid-email') {
        message = 'Adresse courriel invalide';
      } else if (erreur.code === 'auth/weak-password') {
        message = 'Le mot de passe est trop faible';
      } else if (erreur.message) {
        message = erreur.message;
      }
      
      Alert.alert('Erreur', message);
      throw erreur;
    } finally {
      setChargement(false);
    }
  };

  const seConnecter = async (email: string, motDePasse: string) => {
    try {
      setChargement(true);
      
      if (!email || !motDePasse) {
        throw new Error('Veuillez remplir tous les champs');
      }

      await auth().signInWithEmailAndPassword(email, motDePasse);
    } catch (erreur: any) {
      let message = 'Erreur lors de la connexion';
      
      if (erreur.code === 'auth/user-not-found') {
        message = 'Aucun compte trouvé avec cette adresse';
      } else if (erreur.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect';
      } else if (erreur.code === 'auth/invalid-email') {
        message = 'Adresse courriel invalide';
      } else if (erreur.code === 'auth/user-disabled') {
        message = 'Ce compte a été désactivé';
      } else if (erreur.message) {
        message = erreur.message;
      }
      
      Alert.alert('Erreur', message);
      throw erreur;
    } finally {
      setChargement(false);
    }
  };

  const seConnecterAvecGoogle = async () => {
    try {
      setChargement(true);
      // Pour Google Sign-In, vous devez installer et configurer @react-native-google-signin/google-signin
      // Cela nécessite des étapes supplémentaires dans Firebase Console
      Alert.alert(
        'Fonctionnalité bientôt disponible',
        'La connexion avec Google sera disponible dans une prochaine mise à jour'
      );
    } catch (erreur: any) {
      Alert.alert('Erreur', erreur.message || 'Erreur lors de la connexion avec Google');
      throw erreur;
    } finally {
      setChargement(false);
    }
  };

  const reinitialiserMotDePasse = async (email: string) => {
    try {
      if (!email) {
        throw new Error('Veuillez entrer votre adresse courriel');
      }

      await auth().sendPasswordResetEmail(email);
      
      Alert.alert(
        'Email envoyé!',
        'Un lien de réinitialisation a été envoyé à ' + email
      );
    } catch (erreur: any) {
      let message = 'Erreur lors de l\'envoi de l\'email';
      
      if (erreur.code === 'auth/user-not-found') {
        message = 'Aucun compte trouvé avec cette adresse';
      } else if (erreur.code === 'auth/invalid-email') {
        message = 'Adresse courriel invalide';
      }
      
      Alert.alert('Erreur', message);
      throw erreur;
    }
  };

  const seDeconnecter = async () => {
    try {
      await auth().signOut();
    } catch (erreur: any) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
      throw erreur;
    }
  };

  const completerPremierLancement = async () => {
    try {
      await AsyncStorage.setItem('premierLancement', 'false');
      setPremierLancement(false);
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde du premier lancement:', erreur);
    }
  };

  const genererCodeAcces = async (): Promise<string> => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await AsyncStorage.setItem('codeAcces', code);
      return code;
    } catch (erreur) {
      console.error('Erreur lors de la génération du code:', erreur);
      throw erreur;
    }
  };

  return (
    <ContexteAuth.Provider
      value={{
        utilisateur,
        chargement,
        premierLancement,
        inscrire,
        seConnecter,
        seConnecterAvecGoogle,
        seDeconnecter,
        reinitialiserMotDePasse,
        completerPremierLancement,
        genererCodeAcces,
      }}
    >
      {children}
    </ContexteAuth.Provider>
  );
};

export const utiliserAuth = () => {
  const contexte = useContext(ContexteAuth);
  if (!contexte) {
    throw new Error('utiliserAuth doit être utilisé dans un FournisseurAuth');
  }
  return contexte;
};