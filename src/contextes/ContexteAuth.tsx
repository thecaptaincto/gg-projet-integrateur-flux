import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  estCourrielValide,
  estMotDePasseValideConnexion,
  estMotDePasseValideInscription,
} from '../utils/validationFormulaire';

// Contrat du contexte : liste exhaustive des données et actions disponibles
// pour tous les composants enfants abonnés au contexte d'authentification
interface ContexteAuthType {
  utilisateur: FirebaseAuthTypes.User | null;
  initialisation: boolean;
  chargement: boolean;
  premierLancement: boolean;
  inscrire: (email: string, motDePasse: string, nom: string) => Promise<void>;
  seConnecter: (email: string, motDePasse: string) => Promise<void>;
  seConnecterAvecGoogle: () => Promise<void>;
  seDeconnecter: () => Promise<void>;
  reinitialiserMotDePasse: (email: string) => Promise<void>;
  completerPremierLancement: () => Promise<void>;
  genererCodeAcces: () => Promise<string>;
  codeAccesActif: boolean;
  codeAccesVerifie: boolean;
  activerCodeAcces: (actif: boolean) => Promise<void>;
  obtenirCodeAcces: () => Promise<string | null>;
  regenererCodeAcces: () => Promise<string>;
  verifierCodeAcces: (code: string) => Promise<void>;
}

// Contexte initialisé à undefined : le hook utiliserAuth() lèvera une erreur
// explicite si un composant tente d'y accéder hors du FournisseurAuth
const ContexteAuth = createContext<ContexteAuthType | undefined>(undefined);

// Fournisseur global d'authentification. Encapsule toute la logique Firebase
// et expose l'état de l'utilisateur à l'ensemble de l'arbre de composants.
export const FournisseurAuth = ({ children }: { children: ReactNode }) => {
  const [utilisateur, setUtilisateur] = useState<FirebaseAuthTypes.User | null>(null);
  // `initialisation` bloque le rendu de NavigateurApp jusqu'à ce que Firebase
  // ait vérifié la session persistée ET que la sécurité locale soit chargée.
  const [initialisation, setInitialisation] = useState(true);
  // `chargement` est réservé aux actions (connexion/inscription/etc.) pour désactiver les boutons.
  const [chargement, setChargement] = useState(false);
  const [premierLancement, setPremierLancement] = useState(true);
  const [codeAccesActif, setCodeAccesActif] = useState(false);
  const [codeAccesVerifie, setCodeAccesVerifie] = useState(false);
  const codeAccesRef = React.useRef<string | null>(null);
  const [authPret, setAuthPret] = useState(false);
  const [securitePrete, setSecuritePrete] = useState(false);

  useEffect(() => {
    // Abonnement à l'état d'authentification Firebase : mis à jour en temps réel
    // lors de la connexion, déconnexion ou expiration de session
    const desabonner = auth().onAuthStateChanged((user) => {
      setUtilisateur(user);
      setCodeAccesVerifie(false);
      setAuthPret(true);
    });

    // La clé 'premierLancement' est absente au tout premier démarrage (null),
    // ce qui permet d'afficher l'écran d'accueil au lieu de l'écran de connexion
    const verifierPremierLancement = async () => {
      const valeur = await AsyncStorage.getItem('premierLancement');
      setPremierLancement(valeur === null);
    };

    const chargerSecurite = async () => {
      try {
        const [actif, codeLegacy] = await Promise.all([
          AsyncStorage.getItem('codeAccesActif'),
          // rétro-compat : l'app stockait déjà 'codeAcces'
          AsyncStorage.getItem('codeAcces'),
        ]);
        setCodeAccesActif(actif === 'true');
        codeAccesRef.current = codeLegacy ?? null;
      } catch {
        // ignore
      } finally {
        setSecuritePrete(true);
      }
    };

    void verifierPremierLancement();
    void chargerSecurite();

    // Nettoyage : désabonnement de l'écouteur Firebase quand le composant est démonté
    return desabonner;
  }, []);

  useEffect(() => {
    setInitialisation(!(authPret && securitePrete));
  }, [authPret, securitePrete]);

  useEffect(() => {
    if (!utilisateur) {
      setCodeAccesVerifie(false);
      return;
    }
    if (!codeAccesActif) {
      setCodeAccesVerifie(true);
    }
  }, [codeAccesActif, utilisateur]);

  const obtenirCodeAcces = async (): Promise<string | null> => {
    if (codeAccesRef.current) {
      return codeAccesRef.current;
    }
    try {
      const code = await AsyncStorage.getItem('codeAcces');
      codeAccesRef.current = code;
      return code;
    } catch {
      return null;
    }
  };

  const genererNouveauCodeAcces = async (): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem('codeAcces', code);
    codeAccesRef.current = code;
    return code;
  };

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

      const courrielNettoye = email.trim().toLowerCase();
      const nomNettoye = nom.trim();

      // Validation
      if (!estCourrielValide(courrielNettoye)) {
        throw new Error('Adresse courriel invalide');
      }
      if (!estMotDePasseValideInscription(motDePasse)) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre');
      }
      if (nomNettoye.length < 2) {
        throw new Error('Le nom doit contenir au moins 2 caractères');
      }

      // Créer l'utilisateur
      const credential = await auth().createUserWithEmailAndPassword(
        courrielNettoye,
        motDePasse,
      );
      
      // Mettre à jour le profil
      await credential.user.updateProfile({
        displayName: nomNettoye,
      });

      // Envoyer email de vérification
      await credential.user.sendEmailVerification();

      throw {
        code: 'success',
        message: `Inscription réussie !\n\nUn email de vérification a été envoyé à ${courrielNettoye}. Veuillez vérifier votre boîte de réception.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur; // Re-throw success message
      }
      
      const message = erreur.code 
        ? obtenirMessageErreur(erreur.code, 'inscription')
        : erreur.message || 'Erreur lors de l\'inscription';
      
      throw { code: 'error', message, firebaseCode: erreur.code };
    } finally {
      setChargement(false);
    }
  };

  // Connexion simple : si Firebase réussit, onAuthStateChanged met à jour l'état
  // automatiquement et NavigateurApp redirige sans action supplémentaire
  const seConnecter = async (email: string, motDePasse: string) => {
    try {
      setChargement(true);

      const courrielNettoye = email.trim().toLowerCase();
      const motDePasseNettoye = motDePasse;

      if (!courrielNettoye || !motDePasseNettoye) {
        throw new Error('Veuillez remplir tous les champs');
      }
      if (!estCourrielValide(courrielNettoye)) {
        throw new Error('Adresse courriel invalide');
      }
      // Ne pas imposer les règles "inscription" ici : Firebase accepte des mots
      // de passe plus faibles (min 6) et l'utilisateur peut avoir un compte existant.
      if (!estMotDePasseValideConnexion(motDePasseNettoye)) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      await auth().signInWithEmailAndPassword(courrielNettoye, motDePasseNettoye);
    } catch (erreur: any) {
      const message = erreur.code
        ? obtenirMessageErreur(erreur.code, 'connexion')
        : erreur.message || 'Erreur lors de la connexion';

      throw { code: 'error', message, firebaseCode: erreur.code };
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
      const courrielNettoye = email.trim().toLowerCase();

      if (!courrielNettoye) {
        throw new Error('Veuillez entrer votre adresse courriel');
      }
      if (!estCourrielValide(courrielNettoye)) {
        throw new Error('Adresse courriel invalide.');
      }

      await auth().sendPasswordResetEmail(courrielNettoye);

      throw {
        code: 'success',
        message: `Email envoyé !\n\nUn lien de réinitialisation a été envoyé à ${courrielNettoye}. Vérifiez votre boîte de réception.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur;
      }

      const message = erreur.code
        ? obtenirMessageErreur(erreur.code, 'motdepasse')
        : erreur.message || 'Erreur lors de l\'envoi de l\'email';

      throw { code: 'error', message, firebaseCode: erreur.code };
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
      setCodeAccesVerifie(false);
    } catch (erreur: any) {
      throw { code: 'error', message: 'Erreur lors de la déconnexion', firebaseCode: erreur?.code };
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
      return await genererNouveauCodeAcces();
    } catch (erreur) {
      console.error('Erreur lors de la génération du code:', erreur);
      throw erreur;
    }
  };

  const regenererCodeAcces = async (): Promise<string> => {
    try {
      return await genererNouveauCodeAcces();
    } catch (erreur) {
      throw erreur;
    }
  };

  const activerCodeAcces = async (actif: boolean) => {
    setCodeAccesActif(actif);
    setCodeAccesVerifie(!actif);
    try {
      await AsyncStorage.setItem('codeAccesActif', actif ? 'true' : 'false');
      if (actif) {
        const code = await obtenirCodeAcces();
        if (!code) {
          await genererNouveauCodeAcces();
        }
      }
    } catch {
      // ignore
    }
  };

  const verifierCodeAcces = async (code: string) => {
    const codeNettoye = code.trim();
    const attendu = await obtenirCodeAcces();
    if (!codeAccesActif) {
      setCodeAccesVerifie(true);
      return;
    }
    if (!attendu) {
      throw new Error("Aucun code d'accès n'est défini.");
    }
    if (codeNettoye !== attendu) {
      throw new Error("Code d'accès incorrect.");
    }
    setCodeAccesVerifie(true);
  };

  // Rendu du fournisseur : toutes les fonctions et données du contexte sont passées
  // en value pour être accessibles via utiliserAuth() dans les composants enfants
  return (
    <ContexteAuth.Provider
      value={{
        utilisateur,
        initialisation,
        chargement,
        premierLancement,
        inscrire,
        seConnecter,
        seConnecterAvecGoogle,
        seDeconnecter,
        reinitialiserMotDePasse,
        completerPremierLancement,
        genererCodeAcces,
        codeAccesActif,
        codeAccesVerifie,
        activerCodeAcces,
        obtenirCodeAcces,
        regenererCodeAcces,
        verifierCodeAcces,
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
