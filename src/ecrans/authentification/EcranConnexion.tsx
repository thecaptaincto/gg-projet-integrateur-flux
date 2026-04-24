import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { utiliserAuth } from '../../contextes/ContexteAuth';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import {IconeOeil} from '../../composants/IconeOeil';
import {
  AlertePersonnalisee,
  type TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import type {NavigationProp, ParamListBase} from '@react-navigation/native';
import {theme} from '../../styles/theme';
import {validerEmail} from '../../utils/validation';
import {estMotDePasseValideConnexion} from '../../utils/validationFormulaire';

// Props reçues par le composant via React Navigation
interface PropsEcranConnexion {
  navigation: NavigationProp<ParamListBase>;
}

// La connexion ne comporte que deux champs à surveiller (vs quatre pour l'inscription)
interface ChampsTouchesConnexion {
  email: boolean;
  motDePasse: boolean;
}

// Erreurs indexées sur les mêmes clés que ChampsTouchesConnexion
type ErreursConnexion = Partial<Record<keyof ChampsTouchesConnexion, string>>;

// Structure de la modale d'alerte affichée après une réponse du serveur
interface EtatAlerte {
  visible: boolean;
  type: TypeAlertePersonnalisee;
  titre: string;
  message: string;
}

const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
  typeof valeur === 'object' && valeur !== null;

const obtenirChaine = (valeur: unknown): string | undefined =>
  typeof valeur === 'string' ? valeur : undefined;

const EcranConnexion: React.FC<PropsEcranConnexion> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const {
    seConnecter,
    reinitialiserMotDePasse,
    chargement,
  } = utiliserAuth();

  const [soumissionTentee, setSoumissionTentee] = useState(false);
  const [champsTouches, setChampsTouches] = useState<ChampsTouchesConnexion>({
    email: false,
    motDePasse: false,
  });

  // L'alerte personnalisée est réservée aux retours serveur (erreur Firebase, succès).
  // La validation locale des champs s'affiche directement sous chaque input.
  const [alerte, setAlerte] = useState<EtatAlerte>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  // Validation en temps réel des deux champs : recalculée à chaque frappe
  const erreurs: ErreursConnexion = useMemo(() => {
    const prochainesErreurs: ErreursConnexion = {};
    const courrielNettoye = email.trim();

    if (!courrielNettoye) {
      prochainesErreurs.email = 'Veuillez entrer votre adresse courriel.';
    } else if (!validerEmail(courrielNettoye)) {
      prochainesErreurs.email = 'Adresse courriel invalide.';
    }

    if (!motDePasse) {
      prochainesErreurs.motDePasse = 'Veuillez entrer votre mot de passe.';
    } else if (!estMotDePasseValideConnexion(motDePasse)) {
      prochainesErreurs.motDePasse = 'Minimum 6 caractères.';
    }

    return prochainesErreurs;
  }, [email, motDePasse]);

  // Dérivé booléen : vrai uniquement si les deux champs sont sans erreur
  const formulaireValide = Object.keys(erreurs).length === 0;

  // Les erreurs ne s'affichent que si l'utilisateur a interagi avec le champ
  // ou tenté une soumission, pour ne pas afficher de rouge dès l'ouverture de l'écran
  const afficherErreurEmail =
    (soumissionTentee || champsTouches.email) ? erreurs.email : undefined;
  const afficherErreurMotDePasse =
    (soumissionTentee || champsTouches.motDePasse)
      ? erreurs.motDePasse
      : undefined;

  // Helpers pour contrôler la modale d'alerte depuis les gestionnaires asynchrones
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

  // Déclenche la validation complète au clic, puis appelle Firebase si tout est valide.
  // En cas de succès, le contexte met à jour `utilisateur` et NavigateurApp redirige automatiquement.
  const gererConnexion = async () => {
    setSoumissionTentee(true);
    if (!formulaireValide) {
      afficherAlerte(
        'attention',
        'Attention',
        'Veuillez corriger les champs en rouge avant de continuer.',
      );
      return;
    }

    try {
      await seConnecter(email.trim(), motDePasse);
    } catch (erreur: unknown) {
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
      afficherAlerte(
        'erreur',
        'Erreur de connexion',
        message ?? 'Une erreur est survenue.',
      );
    }
  };

  // La réinitialisation réutilise le champ courriel déjà visible.
  // On force la validation de ce champ avant d'envoyer la requête
  // pour éviter d'appeler Firebase avec une adresse vide ou mal formée.
  const gererMotDePasseOublie = async () => {
    setChampsTouches(etat => ({...etat, email: true}));
    setSoumissionTentee(true);

    const courrielNettoye = email.trim();
    if (!courrielNettoye || !validerEmail(courrielNettoye)) {
      afficherAlerte(
        'attention',
        'Attention',
        'Veuillez entrer une adresse courriel valide.',
      );
      return;
    }

    try {
      await reinitialiserMotDePasse(courrielNettoye);
      afficherAlerte(
        'info',
        'Courriel envoyé',
        'Si un compte existe pour ce courriel, vous recevrez un lien de réinitialisation.',
      );
    } catch (erreur: unknown) {
      const code = estObjet(erreur) ? obtenirChaine(erreur.code) : undefined;
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;

      if (code === 'success') {
        afficherAlerte('info', 'Succès', message ?? 'Courriel envoyé.');
        return;
      }

      afficherAlerte('erreur', 'Erreur', message ?? 'Une erreur est survenue.');
    }
  };

  // Réinitialise la pile de navigation vers l'accueil pour éviter
  // de revenir à la connexion via le bouton retour système du téléphone
  const gererRetour = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Accueil'}],
    });
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        {/* Bouton retour positionné hors du formulaire, en haut de l'écran */}
        <TouchableOpacity
          style={styles.boutonRetour}
          onPress={gererRetour}
        >
          <Text style={styles.texteRetour}>← Retour</Text>
        </TouchableOpacity>

        {/* Zone centrale verticalement centrée contenant tous les éléments du formulaire */}
        <View style={styles.contenuCentre}>
          <Text style={styles.titre}>Connexion</Text>
          <Text style={styles.sousTitre}>
            Si ton compte n'est pas encore vérifié, Flux te guidera pour cliquer
            le lien reçu par courriel.
          </Text>

          {/* Champ courriel — sert aussi de saisie pour la réinitialisation du mot de passe */}
          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Adresse courriel"
              placeholderTextColor={theme.couleurs.placeholder}
              value={email}
              onChangeText={setEmail}
              onBlur={() =>
                setChampsTouches(etat => ({...etat, email: true}))
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {afficherErreurEmail ? (
              <Text style={styles.texteErreur}>{afficherErreurEmail}</Text>
            ) : null}
          </View>

          {/* Champ mot de passe masqué */}
          <View style={styles.groupeChamp}>
            <View style={styles.inputAvecAction}>
              <TextInput
                style={[styles.input, styles.inputMotDePasse]}
                placeholder="Mot de passe"
                placeholderTextColor={theme.couleurs.placeholder}
                value={motDePasse}
                onChangeText={setMotDePasse}
                onBlur={() =>
                  setChampsTouches(etat => ({...etat, motDePasse: true}))
                }
                secureTextEntry={!motDePasseVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setMotDePasseVisible(visible => !visible)}
                style={styles.boutonVisibilite}
                accessibilityRole="button"
                accessibilityLabel={
                  motDePasseVisible
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                }>
                <IconeOeil visible={motDePasseVisible} />
              </TouchableOpacity>
            </View>
            {afficherErreurMotDePasse ? (
              <Text style={styles.texteErreur}>{afficherErreurMotDePasse}</Text>
            ) : null}
          </View>

          {/* Lien discret aligné à droite pour déclencher la réinitialisation du mot de passe */}
          <TouchableOpacity onPress={gererMotDePasseOublie}>
            <Text style={styles.lienOublie}>Mot de passe oublié?</Text>
          </TouchableOpacity>

          {/* Bouton principal : désactivé visuellement et fonctionnellement pendant le chargement */}
          <TouchableOpacity
            style={[
              styles.bouton,
              (!formulaireValide || chargement) && styles.boutonDesactive,
            ]}
            onPress={gererConnexion}
            disabled={!formulaireValide || chargement}
          >
            <Text style={styles.texteBouton}>
              {chargement ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonSecondaire}
            onPress={() =>
              afficherAlerte(
                'info',
                'Connexion Google',
                "Pour activer la vraie connexion Google, il faut configurer Google Sign-In (SHA-1/SHA-256) dans Firebase et ajouter la dépendance native. Dis-moi quand tu es prêt et je l’implémente proprement sans casser Android/iOS.",
              )
            }>
            <Text style={styles.texteBoutonSecondaire}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Lien vers l'inscription pour les nouveaux utilisateurs */}
          <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
            <Text style={styles.lien}>Pas encore de compte? Inscrivez-vous</Text>
          </TouchableOpacity>
        </View>

        {/* Modale d'alerte pour les réponses serveur, rendue hors du formulaire
            pour se superposer à tout l'écran */}
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
  // Transparent pour laisser le dégradé s'afficher derrière le contenu
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
  // flex:1 + justifyContent:'center' place le formulaire au milieu de l'espace restant
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
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteClair,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.82,
  },
  groupeChamp: {
    marginBottom: 15,
  },
  // Fond semi-transparent et bordure légère pour intégrer les champs au dégradé
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
  inputAvecAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.couleurs.champBordure,
    backgroundColor: theme.couleurs.champFond,
    borderRadius: 12,
  },
  inputMotDePasse: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  boutonVisibilite: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteErreur: {
    marginTop: 6,
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.erreur,
  },
  // Ombre portée violette pour accentuer visuellement le bouton de connexion
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
  boutonSecondaire: {
    marginTop: 12,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
  },
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
  texteBoutonSecondaire: {
    color: theme.couleurs.texteClair,
    fontSize: 16,
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
  // Plus petit et aligné à droite pour être discret sans disparaître
  lienOublie: {
    fontFamily: 'LilitaOne-Regular',
    color: theme.couleurs.texteClair,
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
});

export { EcranConnexion };
