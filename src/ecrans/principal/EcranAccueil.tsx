import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

interface ProprietesEcranAccueil {
  navigation: any;
}

// Écran affiché uniquement lors du tout premier lancement de l'application.
// Chaque bouton appelle completerPremierLancement() avant la navigation afin
// de persister l'indicateur dans AsyncStorage et ne plus afficher cet écran
// lors des prochains démarrages.
export const EcranAccueil: React.FC<ProprietesEcranAccueil> = ({
  navigation,
}) => {
  const {completerPremierLancement} = utiliserAuth();

  const gererCreerCompte = async () => {
    await completerPremierLancement();
    navigation.navigate('Inscription');
  };

  const gererConnexion = async () => {
    await completerPremierLancement();
    navigation.navigate('Connexion');
  };

  return (
    <ArrierePlanGradient style={styles.gradient}>
      <SafeAreaView style={styles.conteneur}>
        <Text style={styles.titre}>FLUX</Text>
        <Text style={styles.sousTitre}>
          Suivi d’activité, progression et motivation au même endroit.{'\n'}
          Connecte-toi ou crée ton compte pour commencer.
        </Text>
        <View style={styles.conteneurBoutons}>
          <TouchableOpacity
            style={styles.boutonPrimaire}
            onPress={gererCreerCompte}>
            <Text style={styles.texteBoutonPrimaire}>CRÉER UN COMPTE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonSecondaire}
            onPress={gererConnexion}>
            <Text style={styles.texteBoutonSecondaire}>CONNEXION</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 72,
    color: theme.couleurs.texte,
    marginBottom: 12,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texteClair,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 32,
  },
  conteneurBoutons: {
    width: '100%',
    gap: 20,
  },
  boutonPrimaire: {
    backgroundColor: theme.couleurs.boutonPrimaire,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  texteBoutonPrimaire: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  boutonSecondaire: {
    borderWidth: 2,
    borderColor: theme.couleurs.boutonSecondaireBordure,
    backgroundColor: theme.couleurs.boutonSecondaireFond,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  texteBoutonSecondaire: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.texteBoutonSecondaire,
  },
});
