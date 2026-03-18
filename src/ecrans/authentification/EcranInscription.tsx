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
  estMotDePasseValideInscription,
} from '../../utils/validationFormulaire';

interface PropsEcranInscription {
  navigation: NavigationProp<ParamListBase>;
}

interface ChampsTouchesInscription {
  nom: boolean;
  email: boolean;
  motDePasse: boolean;
  confirmMotDePasse: boolean;
}

type ChampsInscription = keyof ChampsTouchesInscription;
type ErreursInscription = Partial<Record<ChampsInscription, string>>;

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

const EcranInscription: React.FC<PropsEcranInscription> = ({navigation}) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const { inscrire, chargement } = utiliserAuth();
  
  const [soumissionTentee, setSoumissionTentee] = useState(false);
  const [champsTouches, setChampsTouches] = useState<ChampsTouchesInscription>({
    nom: false,
    email: false,
    motDePasse: false,
    confirmMotDePasse: false,
  });

  const [alerte, setAlerte] = useState<EtatAlerte>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  const erreurs: ErreursInscription = useMemo(() => {
    const prochainesErreurs: ErreursInscription = {};

    if (!nom.trim()) {
      prochainesErreurs.nom = 'Le nom est requis.';
    }

    const courrielNettoye = email.trim();
    if (!courrielNettoye) {
      prochainesErreurs.email = 'Veuillez entrer votre adresse courriel.';
    } else if (!estCourrielValide(courrielNettoye)) {
      prochainesErreurs.email = 'Adresse courriel invalide.';
    }

    if (!motDePasse) {
      prochainesErreurs.motDePasse = 'Veuillez entrer un mot de passe.';
    } else if (!estMotDePasseValideInscription(motDePasse)) {
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

  const formulaireValide = Object.keys(erreurs).length === 0;

  const erreurChamp = (champ: ChampsInscription): string | undefined =>
    (soumissionTentee || champsTouches[champ]) ? erreurs[champ] : undefined;

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

      if (code === 'success') {
        afficherAlerte('info', 'Succès', message ?? 'Votre compte a été créé.');
        return;
      }

      afficherAlerte(
        'avertissement',
        "Erreur d'inscription",
        message ?? 'Une erreur est survenue.',
      );
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
          <Text style={styles.titre}>Créer un compte</Text>
          
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

          <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
            <Text style={styles.lien}>Vous avez déjà un compte? Connexion</Text>
          </TouchableOpacity>
        </View>

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
});

export { EcranInscription };
