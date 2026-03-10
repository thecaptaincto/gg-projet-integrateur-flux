import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const obtenirMessageErreur = (codeErreur: string, contexte: 'inscription' | 'connexion' | 'motdepasse' = 'connexion'): string => {
    // Messages d'erreur personnalisés en français
    const messagesInscription: Record<string, string> = {
      'auth/email-already-in-use': 'Cette adresse courriel est déjà utilisée. Essayez de vous connecter.',
      'auth/invalid-email': 'Adresse courriel invalide. Vérifiez le format.',
      'auth/weak-password': 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion Internet.',
    };

    const messagesConnexion: Record<string, string> = {
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse. Créez un compte d\'abord.',
      'auth/wrong-password': 'Mot de passe incorrect. Vérifiez votre saisie.',
      'auth/invalid-email': 'Adresse courriel invalide. Vérifiez le format.',
      'auth/user-disabled': 'Ce compte a été désactivé. Contactez le support.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion Internet.',
    };

    const messagesMotDePasse: Record<string, string> = {
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse courriel.',
      'auth/invalid-email': 'Adresse courriel invalide.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    };

    let messages = messagesConnexion;
    if (contexte === 'inscription') messages = messagesInscription;
    if (contexte === 'motdepasse') messages = messagesMotDePasse;

    return messages[codeErreur] || 'Une erreur inattendue s\'est produite. Réessayez.';
  };

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

      throw {
        code: 'success',
        message: `Inscription réussie !\n\nUn email de vérification a été envoyé à ${email}. Veuillez vérifier votre boîte de réception.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur; // Re-throw success message
      }
      
      const message = erreur.code 
        ? obtenirMessageErreur(erreur.code, 'inscription')
        : erreur.message || 'Erreur lors de l\'inscription';
      
      throw { code: 'error', message };
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
      const message = erreur.code 
        ? obtenirMessageErreur(erreur.code, 'connexion')
        : erreur.message || 'Erreur lors de la connexion';
      
      throw { code: 'error', message };
    } finally {
      setChargement(false);
    }
  };

  const seConnecterAvecGoogle = async () => {
    try {
      setChargement(true);
      throw new Error('La connexion avec Google sera disponible dans une prochaine mise à jour');
    } catch (erreur: any) {
      throw { code: 'error', message: erreur.message };
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
      
      throw {
        code: 'success',
        message: `Email envoyé !\n\nUn lien de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur;
      }
      
      const message = erreur.code 
        ? obtenirMessageErreur(erreur.code, 'motdepasse')
        : erreur.message || 'Erreur lors de l\'envoi de l\'email';
      
      throw { code: 'error', message };
    }
  };

  const seDeconnecter = async () => {
    try {
      await auth().signOut();
      // Réinitialiser le premier lancement lors de la déconnexion
      await AsyncStorage.removeItem('premierLancement');
      setPremierLancement(true);
    } catch (erreur: any) {
      throw { code: 'error', message: 'Erreur lors de la déconnexion' };
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