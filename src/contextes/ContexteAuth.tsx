import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { estMotDePasseValideInscription } from '../utils/validationFormulaire';

// Contrat du contexte : liste exhaustive des données et actions disponibles
// pour tous les composants enfants abonnés au contexte d'authentification
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

// Contexte initialisé à undefined : le hook utiliserAuth() lèvera une erreur
// explicite si un composant tente d'y accéder hors du FournisseurAuth
const ContexteAuth = createContext<ContexteAuthType | undefined>(undefined);

// Fournisseur global d'authentification. Encapsule toute la logique Firebase
// et expose l'état de l'utilisateur à l'ensemble de l'arbre de composants.
export const FournisseurAuth = ({ children }: { children: ReactNode }) => {
  const [utilisateur, setUtilisateur] = useState<FirebaseAuthTypes.User | null>(null);
  // `chargement` démarre à true pour bloquer le rendu de NavigateurApp
  // jusqu'à ce que Firebase ait vérifié la session persistée
  const [chargement, setChargement] = useState(true);
  const [premierLancement, setPremierLancement] = useState(true);

  useEffect(() => {
    // Abonnement à l'état d'authentification Firebase : mis à jour en temps réel
    // lors de la connexion, déconnexion ou expiration de session
    const desabonner = auth().onAuthStateChanged((user) => {
      setUtilisateur(user);
      setChargement(false);
    });

    // La clé 'premierLancement' est absente au tout premier démarrage (null),
    // ce qui permet d'afficher l'écran d'accueil au lieu de l'écran de connexion
    const verifierPremierLancement = async () => {
      const valeur = await AsyncStorage.getItem('premierLancement');
      setPremierLancement(valeur === null);
    };

    verifierPremierLancement();

    // Nettoyage : désabonnement de l'écouteur Firebase quand le composant est démonté
    return desabonner;
  }, []);

  // Traduit les codes d'erreur Firebase en messages lisibles en français.
  // Le paramètre `contexte` permet d'adapter le message selon l'opération en cours,
  // car le même code (ex. 'auth/user-not-found') a un sens différent à l'inscription vs à la connexion.
  const obtenirMessageErreur = (codeErreur: string, contexte: 'inscription' | 'connexion' | 'motdepasse' = 'connexion'): string => {
    // Messages d'erreur personnalisés en français
    const messagesInscription: Record<string, string> = {
      'auth/email-already-in-use': 'Cette adresse courriel est déjà utilisée. Essayez de vous connecter.',
      'auth/invalid-email': 'Adresse courriel invalide. Vérifiez le format.',
      'auth/weak-password': 'Le mot de passe est trop faible. Utilisez au moins 8 caractères, une majuscule et un chiffre.',
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

  // Crée un compte Firebase, met à jour le profil avec le nom affiché,
  // puis envoie un courriel de vérification.
  // Note : un succès est communiqué via un throw avec code 'success' — convention
  // adoptée pour unifier la gestion des réponses dans les écrans appelants.
  const inscrire = async (email: string, motDePasse: string, nom: string) => {
    try {
      setChargement(true);

      // Validation
      if (!email.includes('@')) {
        throw new Error('Adresse courriel invalide');
      }
      if (!estMotDePasseValideInscription(motDePasse)) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre');
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

  // Connexion simple : si Firebase réussit, onAuthStateChanged met à jour l'état
  // automatiquement et NavigateurApp redirige sans action supplémentaire
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

  // Connexion Google non implémentée — stub présent pour respecter l'interface
  // et permettre d'ajouter la fonctionnalité ultérieurement sans modifier les écrans
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

  // Envoie un courriel de réinitialisation via Firebase.
  // Même convention throw {code:'success'} qu'à l'inscription pour uniformiser
  // la gestion côté écran.
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

  // Déconnexion Firebase + réinitialisation de l'indicateur de premier lancement.
  // Cela permet de réafficher l'écran d'accueil si l'utilisateur se reconnecte
  // depuis un état "déconnecté" plutôt que de tomber directement sur la connexion.
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

  // Marque définitivement l'application comme "déjà lancée" dans AsyncStorage.
  // Appelé avant chaque navigation depuis EcranAccueil pour ne plus y revenir.
  const completerPremierLancement = async () => {
    try {
      await AsyncStorage.setItem('premierLancement', 'false');
      setPremierLancement(false);
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde du premier lancement:', erreur);
    }
  };

  // Génère un code d'accès numérique à 6 chiffres et le persiste localement.
  // Math.floor(100000 + Math.random() * 900000) garantit un résultat entre 100000 et 999999.
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

  // Rendu du fournisseur : toutes les fonctions et données du contexte sont passées
  // en value pour être accessibles via utiliserAuth() dans les composants enfants
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

// Hook personnalisé qui garantit que le contexte est toujours consommé
// à l'intérieur du FournisseurAuth. Lance une erreur claire en développement
// si un composant oublie de s'y enregistrer.
export const utiliserAuth = () => {
  const contexte = useContext(ContexteAuth);
  if (!contexte) {
    throw new Error('utiliserAuth doit être utilisé dans un FournisseurAuth');
  }
  return contexte;
};
