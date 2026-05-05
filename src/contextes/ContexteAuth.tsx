import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import {
  estCourrielValide,
  estMotDePasseValideConnexion,
  estMotDePasseValideInscription,
} from '../utils/validationFormulaire';
import {
  configurationGoogle,
  googleAuthEstConfiguree,
} from '../config/googleAuth';
import { serviceChiffrement } from '../services/serviceChiffrement';
import { serviceRateLimiting } from '../services/serviceRateLimiting';
import { executerMigrationSecurite } from '../services/migrationSecurite';
import {
  supprimerDocumentUtilisateur,
  supprimerJetonPushUtilisateur,
} from '../utils/jetonsPush';
import {supprimerTousLesEntrainements} from '../utils/stockageEntrainements';

interface ValeurContexteAuth {
  utilisateur: FirebaseAuthTypes.User | null;
  initialisation: boolean;
  chargement: boolean;
  premierLancement: boolean;
  courrielVerifie: boolean;
  inscrire: (email: string, motDePasse: string, nom: string) => Promise<void>;
  seConnecter: (email: string, motDePasse: string) => Promise<void>;
  envoyerCourrielVerification: () => Promise<void>;
  actualiserVerificationCourriel: () => Promise<void>;
  seConnecterAvecGoogle: () => Promise<void>;
  rafraichirUtilisateur: () => Promise<void>;
  seDeconnecter: () => Promise<void>;
  supprimerCompte: () => Promise<void>;
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

const ContexteAuth = createContext<ValeurContexteAuth | undefined>(undefined);

export const FournisseurAuth = ({children}: {children: ReactNode}) => {
  const [utilisateur, setUtilisateur] = useState<FirebaseAuthTypes.User | null>(null);
  const [initialisation, setInitialisation] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [premierLancement, setPremierLancement] = useState(true);
  const [courrielVerifie, setCourrielVerifie] = useState(false);
  const [codeAccesActif, setCodeAccesActif] = useState(false);
  const [codeAccesVerifie, setCodeAccesVerifie] = useState(false);
  const codeAccesRef = React.useRef<string | null>(null);
  const [authPret, setAuthPret] = useState(false);
  const [securitePrete, setSecuritePrete] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleAuthEstConfiguree()
        ? configurationGoogle.webClientId
        : undefined,
      iosClientId: configurationGoogle.iosClientId,
      offlineAccess: false,
    });

    let desabonner = () => {};

    try {
      desabonner = auth().onAuthStateChanged(user => {
        setUtilisateur(user);
        setCourrielVerifie(user?.emailVerified ?? false);
        setCodeAccesVerifie(false);
        setAuthPret(true);
      });
    } catch (erreur) {
      console.error("Erreur d'initialisation de l'authentification Firebase :", erreur);
      setUtilisateur(null);
      setCourrielVerifie(false);
      setCodeAccesVerifie(false);
      setAuthPret(true);
    }

    const verifierPremierLancement = async () => {
      const valeur = await AsyncStorage.getItem('premierLancement');
      setPremierLancement(valeur === null);
    };

    const chargerSecurite = async () => {
      try {
        // ✅ Exécuter migrations de sécurité
        await executerMigrationSecurite();

        const [actif, ancienCode] = await Promise.all([
          AsyncStorage.getItem('codeAccesActif'),
          serviceChiffrement.charger('codeAcces'), // Chiffré
        ]);
        setCodeAccesActif(actif === 'true');
        codeAccesRef.current = ancienCode ?? null;
      } catch {
        // ignore
      } finally {
        setSecuritePrete(true);
      }
    };

    void verifierPremierLancement();
    void chargerSecurite();

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
    if (!courrielVerifie) {
      setCodeAccesVerifie(false);
      return;
    }
    if (!codeAccesActif) {
      setCodeAccesVerifie(true);
    }
  }, [codeAccesActif, courrielVerifie, utilisateur]);

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
    // Générer 8 chiffres (100 millions de combinaisons)
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    await serviceChiffrement.sauvegarder('codeAcces', code);
    codeAccesRef.current = code;
    return code;
  };

  const obtenirMessageErreur = (
    codeErreur: string,
    contexte: 'inscription' | 'connexion' | 'motdepasse' = 'connexion',
  ): string => {
    const messagesInscription: Record<string, string> = {
      'auth/email-already-in-use':
        'Cet courriel est déjà utilisé. Essayez de vous connecter.',
      'auth/invalid-email': 'Veuillez entrer un courriel valide.',
      'auth/weak-password':
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.',
      'auth/network-request-failed':
        'Erreur réseau. Vérifiez votre connexion Internet.',
    };

    // ✅ Messages génériques pour éviter l'énumération d'utilisateurs
    const messagesConnexion: Record<string, string> = {
      'auth/user-not-found':
        'Courriel ou mot de passe incorrect.',
      'auth/wrong-password': 'Courriel ou mot de passe incorrect.',
      'auth/invalid-credential':
        'Courriel ou mot de passe incorrect.',
      'auth/invalid-email': 'Veuillez entrer un courriel valide.',
      'auth/user-disabled': 'Ce compte a été désactivé. Contactez le support.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      'auth/network-request-failed':
        'Erreur réseau. Vérifiez votre connexion Internet.',
    };

    const messagesMotDePasse: Record<string, string> = {
      'auth/invalid-email': 'Veuillez entrer un courriel valide.',
      'auth/network-request-failed':
        'Erreur réseau. Vérifiez votre connexion.',
    };

    let messages = messagesConnexion;
    if (contexte === 'inscription') messages = messagesInscription;
    if (contexte === 'motdepasse') messages = messagesMotDePasse;

    return (
      messages[codeErreur] ||
      "Une erreur inattendue s'est produite. Réessayez."
    );
  };

  const inscrire = async (email: string, motDePasse: string, nom: string) => {
    try {
      setChargement(true);

      const courrielNettoye = email.trim().toLowerCase();
      const nomNettoye = nom.trim();

      if (!estCourrielValide(courrielNettoye)) {
        throw new Error('Adresse courriel invalide');
      }
      if (!estMotDePasseValideInscription(motDePasse)) {
        throw new Error(
          'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre',
        );
      }
      if (nomNettoye.length < 2) {
        throw new Error('Le nom doit contenir au moins 2 caractères');
      }

      const resultatInscription = await auth().createUserWithEmailAndPassword(
        courrielNettoye,
        motDePasse,
      );

      await resultatInscription.user.updateProfile({
        displayName: nomNettoye,
      });

      await resultatInscription.user.sendEmailVerification();
      setCourrielVerifie(resultatInscription.user.emailVerified);

      throw {
        code: 'success',
        message: `Inscription réussie !\n\nUn courriel de vérification a été envoyé à ${courrielNettoye}. Clique sur le lien reçu, puis reviens dans Flux.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur;
      }

      const message = erreur.code
        ? obtenirMessageErreur(erreur.code, 'inscription')
        : erreur.message || "Erreur lors de l'inscription";

      throw {code: 'error', message, firebaseCode: erreur.code};
    } finally {
      setChargement(false);
    }
  };

  const seConnecter = async (email: string, motDePasse: string) => {
    try {
      setChargement(true);

      const courrielNettoye = email.trim().toLowerCase();
      const motDePasseNettoye = motDePasse;

      // ✅ Rate limiting: protéger contre le brute force
      if (!serviceRateLimiting.verifier(courrielNettoye, 5, 3600000)) {
        const attente = serviceRateLimiting.obtenirDelaiAttente(courrielNettoye);
        const secondes = Math.ceil(attente / 1000);
        throw new Error(`Compte temporairement verrouillé. Réessayez dans ${secondes}s.`);
      }

      if (!courrielNettoye || !motDePasseNettoye) {
        throw new Error('Veuillez remplir tous les champs');
      }
      if (!estCourrielValide(courrielNettoye)) {
        throw new Error('Adresse courriel invalide');
      }
      if (!estMotDePasseValideConnexion(motDePasseNettoye)) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      const resultatConnexion = await auth().signInWithEmailAndPassword(
        courrielNettoye,
        motDePasseNettoye,
      );
      await resultatConnexion.user.reload();
      const utilisateurRecharge =
        auth().currentUser ?? resultatConnexion.user;
      setUtilisateur(utilisateurRecharge);
      setCourrielVerifie(utilisateurRecharge.emailVerified);
      
      // ✅ Réinitialiser rate limit en cas de succès
      serviceRateLimiting.reinitialiser(courrielNettoye);
    } catch (erreur: any) {
      const message = erreur.code
        ? obtenirMessageErreur(erreur.code, 'connexion')
        : erreur.message || 'Erreur lors de la connexion';

      throw {code: 'error', message, firebaseCode: erreur.code};
    } finally {
      setChargement(false);
    }
  };

  const envoyerCourrielVerification = async () => {
    try {
      setChargement(true);
      const user = auth().currentUser;

      if (!user) {
        throw new Error('Aucun utilisateur connecté.');
      }

      await user.sendEmailVerification();

      throw {
        code: 'success',
        message: `Un courriel de vérification a été envoyé à ${user.email ?? ''}. Vérifie aussi les indésirables.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur;
      }

      throw {
        code: 'error',
        message:
          erreur.message ||
          "Erreur lors de l'envoi du courriel de vérification.",
      };
    } finally {
      setChargement(false);
    }
  };

  const actualiserVerificationCourriel = async () => {
    try {
      setChargement(true);
      const user = auth().currentUser;

      if (!user) {
        throw new Error('Aucun utilisateur connecté.');
      }

      await user.reload();
      const utilisateurRecharge = auth().currentUser ?? user;
      setUtilisateur(utilisateurRecharge);
      setCourrielVerifie(utilisateurRecharge.emailVerified);

      if (!utilisateurRecharge.emailVerified) {
        throw new Error(
          "Le courriel n'est pas encore vérifié. Clique sur le lien reçu, puis réessaie.",
        );
      }
    } finally {
      setChargement(false);
    }
  };

  const seConnecterAvecGoogle = async () => {
    try {
      setChargement(true);

      if (!googleAuthEstConfiguree()) {
        throw new Error(
          "La connexion Google n'est pas encore finalisée dans le code. Ajoute ton ID client Web Google dans src/config/googleAuth.ts.",
        );
      }

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const reponseGoogle = await GoogleSignin.signIn();
      if (!isSuccessResponse(reponseGoogle)) {
        throw {code: 'google/cancelled', message: 'Connexion Google annulée.'};
      }

      const jetonIdentite = reponseGoogle.data.idToken;
      if (!jetonIdentite) {
        throw new Error(
          "Google n'a pas retourné de jeton d'identité. Vérifie l'ID client Web Firebase/Google.",
        );
      }

      const identifiantGoogle =
        auth.GoogleAuthProvider.credential(jetonIdentite);
      const resultatConnexionGoogle = await auth().signInWithCredential(
        identifiantGoogle,
      );
      await resultatConnexionGoogle.user.reload();
      const utilisateurRecharge =
        auth().currentUser ?? resultatConnexionGoogle.user;
      setUtilisateur(utilisateurRecharge);
      setCourrielVerifie(utilisateurRecharge.emailVerified);
    } catch (erreur: any) {
      if (isErrorWithCode(erreur)) {
        if (erreur.code === statusCodes.SIGN_IN_CANCELLED) {
          throw {
            code: 'google/cancelled',
            message: 'Connexion Google annulée.',
          };
        }
        if (erreur.code === statusCodes.IN_PROGRESS) {
          throw {
            code: 'google/in-progress',
            message: 'Une connexion Google est déjà en cours.',
          };
        }
        if (erreur.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw {
            code: 'google/play-services',
            message:
              'Google Play Services est absent ou obsolète sur cet appareil.',
          };
        }
      }

      const codeErreur = erreur?.code as string | undefined;
      if (codeErreur === 'auth/account-exists-with-different-credential') {
        throw {
          code: 'error',
          message:
            'Un compte existe déjà avec ce courriel via une autre méthode de connexion.',
          firebaseCode: codeErreur,
        };
      }

      throw {
        code: codeErreur ?? 'error',
        message:
          erreur?.message || 'Erreur lors de la connexion avec Google.',
        firebaseCode: codeErreur,
      };
    } finally {
      setChargement(false);
    }
  };

  const rafraichirUtilisateur = async () => {
    const user = auth().currentUser;
    if (!user) {
      setUtilisateur(null);
      setCourrielVerifie(false);
      return;
    }

    await user.reload();
    const utilisateurRecharge = auth().currentUser ?? user;
    setUtilisateur(utilisateurRecharge);
    setCourrielVerifie(utilisateurRecharge.emailVerified);
  };

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
        message: `Courriel envoyé !\n\nUn lien de réinitialisation a été envoyé à ${courrielNettoye}. Vérifiez votre boîte de réception.`,
      };
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        throw erreur;
      }

      const message = erreur.code
        ? obtenirMessageErreur(erreur.code, 'motdepasse')
        : erreur.message || "Erreur lors de l'envoi de l'email";

      throw {code: 'error', message, firebaseCode: erreur.code};
    }
  };

  const seDeconnecter = async () => {
    try {
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore: l'utilisateur courant n'est pas forcément connecté via Google.
      }
      await auth().signOut();
      setCourrielVerifie(false);
      setCodeAccesVerifie(false);
    } catch (erreur: any) {
      throw {
        code: 'error',
        message: 'Erreur lors de la déconnexion',
        firebaseCode: erreur?.code,
      };
    }
  };

  const supprimerCompte = async () => {
    try {
      setChargement(true);
      const user = auth().currentUser;

      if (!user) {
        throw new Error('Aucun utilisateur connecté.');
      }

      const {uid} = user;
      const derniereConnexion = Date.parse(user.metadata.lastSignInTime ?? '');

      if (
        Number.isFinite(derniereConnexion) &&
        Date.now() - derniereConnexion > 5 * 60 * 1000
      ) {
        throw {code: 'auth/requires-recent-login'};
      }

      try {
        await supprimerJetonPushUtilisateur(uid);
      } catch {
        // Nettoyage distant best-effort : ne bloque pas la suppression du compte.
      }

      try {
        await supprimerDocumentUtilisateur(uid);
      } catch {
        // Le document Firestore n'existe pas forcément ou peut être protégé par les règles.
      }

      try {
        await supprimerTousLesEntrainements(uid);
      } catch {
        // Le compte doit pouvoir être supprimé même si le nettoyage local échoue.
      }

      await user.delete();
      setUtilisateur(null);
      setCourrielVerifie(false);
      setCodeAccesVerifie(false);
    } catch (erreur: any) {
      const codeErreur = erreur?.code as string | undefined;
      let message =
        erreur?.message || 'Impossible de supprimer le compte pour le moment.';

      if (codeErreur === 'auth/requires-recent-login') {
        message =
          'Pour supprimer ce compte, reconnecte-toi d’abord puis réessaie.';
      } else if (codeErreur === 'auth/network-request-failed') {
        message = 'Erreur réseau. Vérifiez votre connexion puis réessayez.';
      }

      throw {code: 'error', message, firebaseCode: codeErreur};
    } finally {
      setChargement(false);
    }
  };

  const completerPremierLancement = async () => {
    try {
      await AsyncStorage.setItem('premierLancement', 'false');
      setPremierLancement(false);
    } catch (erreur) {
      console.error(
        'Erreur lors de la sauvegarde du premier lancement:',
        erreur,
      );
    }
  };

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

  return (
    <ContexteAuth.Provider
      value={{
        utilisateur,
        initialisation,
        chargement,
        premierLancement,
        courrielVerifie,
        inscrire,
        seConnecter,
        envoyerCourrielVerification,
        actualiserVerificationCourriel,
        seConnecterAvecGoogle,
        rafraichirUtilisateur,
        seDeconnecter,
        supprimerCompte,
        reinitialiserMotDePasse,
        completerPremierLancement,
        genererCodeAcces,
        codeAccesActif,
        codeAccesVerifie,
        activerCodeAcces,
        obtenirCodeAcces,
        regenererCodeAcces,
        verifierCodeAcces,
      }}>
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
