import React from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {utiliserAuth} from '../../contextes/ContexteAuth';

interface PropsEcranAccueil {
  navigation: any;
}

export const EcranAccueil: React.FC<PropsEcranAccueil> = ({navigation}) => {
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
    <LinearGradient
      colors={['#1a0024', '#3b014a', '#5c0073']}
      style={styles.gradient}>
      <SafeAreaView style={styles.conteneur}>
        <Text style={styles.titre}>FLUX</Text>
        <Text style={styles.sousTitre}>
          Bienvenue! :){'\n'}
          Amusez-vous bien!
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
    </LinearGradient>
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
    fontFamily: 'LilitaOne-Regular',
    fontSize: 72,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sousTitre: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 28,
    color: '#FDE2FF',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 34,
  },
  conteneurBoutons: {
    width: '100%',
    gap: 20,
  },
  boutonPrimaire: {
    backgroundColor: '#FDE2FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  texteBoutonPrimaire: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 22,
    color: '#2a0134',
  },
  boutonSecondaire: {
    borderWidth: 2,
    borderColor: '#FDE2FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  texteBoutonSecondaire: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 22,
    color: '#FDE2FF',
  },
});