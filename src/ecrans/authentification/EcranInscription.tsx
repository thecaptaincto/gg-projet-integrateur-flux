import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { utiliserAuth } from '../../contextes/ContexteAuth';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import { AlertePersonnalisee } from '../../composants/AlertePersonnalisee';
import type {NavigationProp, ParamListBase} from '@react-navigation/native';
import {theme} from '../../styles/theme';
import {validerEmail, validerMotDePasse} from '../../utils/validation';

// Props reçues par le composant via React Navigation
interface PropsEcranInscription {
  navigation: NavigationProp<ParamListBase>;
}

// Suivi de l'interaction utilisateur : un champ "touché" déclenche
// l'affichage de son message d'erreur dès qu'il perd le focus
interface ChampsTouchesInscription {
  nom: boolean;
  email: boolean;
  motDePasse: boolean;
  confirmMotDePasse: boolean;
}

// Types utilitaires dérivés pour contraindre les clés et messages d'erreur
type ChampsInscription = keyof ChampsTouchesInscription;
type ErreursInscription = Partial<Record<ChampsInscription, string>>;

// Structure de l'état de la modale d'alerte (succès ou erreur serveur)
interface EtatAlerte {
  visible: boolean;
  type: 'avertissement' | 'info' | 'confirmation';
  titre: string;
  message: string;
}

// Gardes de type pour extraire des valeurs d'un objet d'erreur inconnu
// sans risquer de plantage TypeScript sur un catch (erreur: unknown)
const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  typeof valeur === 'object' && valeur !== null;

const obtenirChaine = (valeur: unknown): string | undefined =>
  typeof valeur === 'string' ? valeur : undefined;

const EcranInscription: React.FC<PropsEcranInscription> = ({navigation}) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const { inscrire, chargement } = utiliserAuth();

  // `soumissionTentee` force l'affichage de toutes les erreurs dès le premier clic sur "S'inscrire"
  // `champsTouches` permet de n'afficher l'erreur d'un champ que lorsqu'il a perdu le focus (onBlur)
  const [soumissionTentee, setSoumissionTentee] = useState(false);
  const [champsTouches, setChampsTouches] = useState<ChampsTouchesInscription>({
    nom: false,
    email: false,
    motDePasse: false,
    confirmMotDePasse: false,
  });

  // État de la modale : invisible par défaut, mis à jour après chaque réponse du serveur
  const [alerte, setAlerte] = useState<EtatAlerte>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  // Calcul des erreurs de validation en temps réel avec useMemo.
  // L'objet est recalculé à chaque frappe, mais les erreurs ne s'affichent
  // que si le champ a été touché ou si une soumission a été tentée.
  const erreurs: ErreursInscription = useMemo(() => {
    const prochainesErreurs: ErreursInscription = {};

    if (!nom.trim()) {
      prochainesErreurs.nom = 'Le nom est requis.';
    }

    const courrielNettoye = email.trim();
    if (!courrielNettoye) {
      prochainesErreurs.email = 'Veuillez entrer votre adresse courriel.';
    } else if (!validerEmail(courrielNettoye)) {
      prochainesErreurs.email = 'Adresse courriel invalide.';
    }

    if (!motDePasse) {
      prochainesErreurs.motDePasse = 'Veuillez entrer un mot de passe.';
    } else if (!validerMotDePasse(motDePasse)) {
      prochainesErreurs.motDePasse =
        'Minimum 8 caractères, une majuscule et un chiffre.';
    }

    if (!confirmMotDePasse) {
      prochainesErreurs.confirmMotDePasse = 'Veuillez confirmer le mot de passe.';
    } else if (confirmMotDePasse !== motDePasse) {
      prochainesErreurs.confirmMotDePasse = 'Les mots de passe ne correspondent pas.';
    }

    return prochainesErreurs;
  }, [confirmMotDePasse, email, motDePasse, nom]);

  // Si l'objet erreurs est vide, tous les champs sont valides
  const formulaireValide = Object.keys(erreurs).length === 0;

  // Retourne le message d'erreur d'un champ uniquement s'il a été interagi
  // (touché ou soumission tentée), pour ne pas afficher d'erreurs au chargement
  const erreurChamp = (champ: ChampsInscription): string | undefined =>
    (soumissionTentee || champsTouches[champ]) ? erreurs[champ] : undefined;

  // Helpers pour ouvrir et fermer la modale d'alerte depuis n'importe quel gestionnaire
  const afficherAlerte = (
    type: EtatAlerte['type'],
    titreAlerte: string,
    messageAlerte: string,
  ) => {
    setAlerte({visible: true, type, titre: titreAlerte, message: messageAlerte});
  };

  const fermerAlerte = () => {
    setAlerte(etat => ({...etat, visible: false}));
  };

  const gererInscription = async () => {
    // Marquer tous les champs comme "touchés" pour révéler immédiatement
    // toutes les erreurs de validation si l'utilisateur clique sans avoir tout rempli
    setSoumissionTentee(true);
    setChampsTouches({
      nom: true,
      email: true,
      motDePasse: true,
      confirmMotDePasse: true,
    });

    if (!formulaireValide) {
      return;
    }

    try {
      await inscrire(email, motDePasse, nom);
      afficherAlerte('info', 'Succès', 'Votre compte a été créé.');
    } catch (erreur: unknown) {
      const code = estObjet(erreur) ? obtenirChaine(erreur.code) : undefined;
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;

      // Le contexte utilise throw {code: 'success'} pour signaler un succès ;
      // on l'intercepte ici pour afficher le message de confirmation plutôt qu'une erreur
      if (code === 'success') {
        afficherAlerte('info', 'Succès', message ?? 'Votre compte a été créé.');
        return;
      }

      // Toute autre erreur (Firebase ou validation) s'affiche en mode avertissement
      afficherAlerte(
        'avertissement',
        "Erreur d'inscription",
        message ?? 'Une erreur est survenue.',
      );
    }
  };

  // Réinitialise la pile de navigation vers l'accueil pour empêcher de
  // revenir à l'inscription en appuyant sur le bouton retour du téléphone
  const gererRetour = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Accueil'}],
    });
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        {/* Bouton retour aligné en haut à gauche, hors du formulaire centré */}
        <TouchableOpacity
          style={styles.boutonRetour}
          onPress={gererRetour}
        >
          <Text style={styles.texteRetour}>← Retour</Text>
        </TouchableOpacity>

        {/* Conteneur centré verticalement qui regroupe le titre et tous les champs */}
        <View style={styles.contenuCentre}>
          <Text style={styles.titre}>Créer un compte</Text>

          {/* Champ Nom — autoCapitalize="words" met la première lettre en majuscule */}
          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor={theme.couleurs.placeholder}
              value={nom}
              onChangeText={setNom}
              onBlur={() => setChampsTouches(etat => ({...etat, nom: true}))}
              autoCapitalize="words"
            />
            {erreurChamp('nom') ? (
              <Text style={styles.texteErreur}>{erreurChamp('nom')}</Text>
            ) : null}
          </View>

          {/* Champ courriel — keyboardType="email-address" affiche le clavier adapté */}
          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Adresse courriel"
              placeholderTextColor={theme.couleurs.placeholder}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setChampsTouches(etat => ({...etat, email: true}))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {erreurChamp('email') ? (
              <Text style={styles.texteErreur}>{erreurChamp('email')}</Text>
            ) : null}
          </View>

          {/* Champ mot de passe — secureTextEntry masque les caractères saisis */}
          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe (min. 8 caractères)"
              placeholderTextColor={theme.couleurs.placeholder}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onBlur={() =>
                setChampsTouches(etat => ({...etat, motDePasse: true}))
              }
              secureTextEntry
              autoCapitalize="none"
            />
            {erreurChamp('motDePasse') ? (
              <Text style={styles.texteErreur}>{erreurChamp('motDePasse')}</Text>
            ) : null}
          </View>

          {/* Champ confirmation — vérifie que les deux mots de passe sont identiques */}
          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={theme.couleurs.placeholder}
              value={confirmMotDePasse}
              onChangeText={setConfirmMotDePasse}
              onBlur={() =>
                setChampsTouches(etat => ({...etat, confirmMotDePasse: true}))
              }
              secureTextEntry
              autoCapitalize="none"
            />
            {erreurChamp('confirmMotDePasse') ? (
              <Text style={styles.texteErreur}>
                {erreurChamp('confirmMotDePasse')}
              </Text>
            ) : null}
          </View>

          {/* Bouton de soumission : grisé visuellement si le formulaire est invalide
              ou si une requête est en cours, et désactivé fonctionnellement pendant le chargement */}
          <TouchableOpacity
            style={[
              styles.bouton,
              (!formulaireValide || chargement) && styles.boutonDesactive,
            ]}
            onPress={gererInscription}
            disabled={chargement}
          >
            <Text style={styles.texteBouton}>
              {chargement ? 'Inscription...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>

          {/* Lien de navigation vers la connexion pour les utilisateurs déjà inscrits */}
          <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
            <Text style={styles.lien}>Vous avez déjà un compte? Connexion</Text>
          </TouchableOpacity>
        </View>

        {/* Modale d'alerte placée hors du ScrollView pour se superposer à tout l'écran */}
        <AlertePersonnalisee
          visible={alerte.visible}
          type={alerte.type}
          titre={alerte.titre}
          message={alerte.message}
          texteConfirmer="OK"
          onConfirmer={fermerAlerte}
          onAnnuler={fermerAlerte}
        />
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  // Transparent pour laisser le dégradé de ArrierePlanGradient s'afficher en arrière-plan
  conteneur: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  boutonRetour: {
    padding: 20,
    alignSelf: 'flex-start',
  },
  texteRetour: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 18,
    color: theme.couleurs.texteClair,
  },
  // flex:1 + justifyContent:'center' centre verticalement le formulaire dans l'espace disponible
  contenuCentre: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  titre: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'LilitaOne-Regular',
    marginBottom: 30,
    textAlign: 'center',
    color: theme.couleurs.texteClair,
  },
  // Chaque groupeChamp enveloppe un TextInput et son éventuel message d'erreur
  groupeChamp: {
    marginBottom: 15,
  },
  // Fond semi-transparent et bordure légère pour que les champs s'intègrent au dégradé
  input: {
    fontFamily: 'LilitaOne-Regular',
    height: 50,
    borderWidth: 1,
    borderColor: theme.couleurs.champBordure,
    backgroundColor: theme.couleurs.champFond,
    color: theme.couleurs.texteClair,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  texteErreur: {
    marginTop: 6,
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.erreur,
  },
  // Ombre portée pour donner de la profondeur au bouton d'action principal
  bouton: {
    backgroundColor: theme.couleurs.violetAccent,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: theme.couleurs.violetAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Grise et rend le bouton semi-transparent quand le formulaire est invalide
  boutonDesactive: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  texteBouton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'LilitaOne-Regular',
  },
  lien: {
    fontFamily: 'LilitaOne-Regular',
    color: theme.couleurs.texteClair,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export { EcranInscription };
