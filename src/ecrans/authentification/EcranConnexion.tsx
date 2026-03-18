import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { utiliserAuth } from '../../contextes/ContexteAuth';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import { AlertePersonnalisee } from '../../composants/AlertePersonnalisee';
import type {NavigationProp, ParamListBase} from '@react-navigation/native';
import {theme} from '../../styles/theme';
import {
  estCourrielValide,
  estMotDePasseValideConnexion,
} from '../../utils/validationFormulaire';

interface PropsEcranConnexion {
  navigation: NavigationProp<ParamListBase>;
}

interface ChampsTouchesConnexion {
  email: boolean;
  motDePasse: boolean;
}

type ErreursConnexion = Partial<Record<keyof ChampsTouchesConnexion, string>>;

interface EtatAlerte {
  visible: boolean;
  type: 'avertissement' | 'info' | 'confirmation';
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
  const { seConnecter, reinitialiserMotDePasse, chargement } = utiliserAuth();
  
  const [soumissionTentee, setSoumissionTentee] = useState(false);
  const [champsTouches, setChampsTouches] = useState<ChampsTouchesConnexion>({
    email: false,
    motDePasse: false,
  });

  // État pour l'alerte personnalisée (réponses serveur uniquement)
  const [alerte, setAlerte] = useState<EtatAlerte>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  const erreurs: ErreursConnexion = useMemo(() => {
    const prochainesErreurs: ErreursConnexion = {};
    const courrielNettoye = email.trim();

    if (!courrielNettoye) {
      prochainesErreurs.email = 'Veuillez entrer votre adresse courriel.';
    } else if (!estCourrielValide(courrielNettoye)) {
      prochainesErreurs.email = 'Adresse courriel invalide.';
    }

    if (!motDePasse) {
      prochainesErreurs.motDePasse = 'Veuillez entrer votre mot de passe.';
    } else if (!estMotDePasseValideConnexion(motDePasse)) {
      prochainesErreurs.motDePasse = 'Le mot de passe doit avoir au moins 8 caractères.';
    }

    return prochainesErreurs;
  }, [email, motDePasse]);

  const formulaireValide = Object.keys(erreurs).length === 0;
  const afficherErreurEmail =
    (soumissionTentee || champsTouches.email) ? erreurs.email : undefined;
  const afficherErreurMotDePasse =
    (soumissionTentee || champsTouches.motDePasse)
      ? erreurs.motDePasse
      : undefined;

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

  const gererConnexion = async () => {
    setSoumissionTentee(true);
    if (!formulaireValide) {
      return;
    }

    try {
      await seConnecter(email, motDePasse);
    } catch (erreur: unknown) {
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
      afficherAlerte(
        'avertissement',
        'Erreur de connexion',
        message ?? 'Une erreur est survenue.',
      );
    }
  };

  const gererMotDePasseOublie = async () => {
    setChampsTouches(etat => ({...etat, email: true}));
    setSoumissionTentee(true);

    if (!email.trim() || !estCourrielValide(email)) {
      return;
    }

    try {
      await reinitialiserMotDePasse(email);
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

      afficherAlerte('avertissement', 'Erreur', message ?? 'Une erreur est survenue.');
    }
  };

  const gererRetour = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Accueil'}],
    });
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <TouchableOpacity 
          style={styles.boutonRetour}
          onPress={gererRetour}
        >
          <Text style={styles.texteRetour}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.contenuCentre}>
          <Text style={styles.titre}>Connexion</Text>

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

          <View style={styles.groupeChamp}>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={theme.couleurs.placeholder}
              value={motDePasse}
              onChangeText={setMotDePasse}
              onBlur={() =>
                setChampsTouches(etat => ({...etat, motDePasse: true}))
              }
              secureTextEntry
              autoCapitalize="none"
            />
            {afficherErreurMotDePasse ? (
              <Text style={styles.texteErreur}>{afficherErreurMotDePasse}</Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={gererMotDePasseOublie}>
            <Text style={styles.lienOublie}>Mot de passe oublié?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bouton,
              (!formulaireValide || chargement) && styles.boutonDesactive,
            ]}
            onPress={gererConnexion}
            disabled={chargement}
          >
            <Text style={styles.texteBouton}>
              {chargement ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
            <Text style={styles.lien}>Pas encore de compte? Inscrivez-vous</Text>
          </TouchableOpacity>
        </View>

        {/* Alerte personnalisée */}
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
  groupeChamp: {
    marginBottom: 15,
  },
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
  lienOublie: {
    fontFamily: 'LilitaOne-Regular',
    color: theme.couleurs.texteClair,
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
});

export { EcranConnexion };
