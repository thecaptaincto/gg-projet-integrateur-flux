import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

// Écran de session d'activité (style Strava).
// `edges` exclut le bord inférieur pour que la barre d'onglets soit adjacente au contenu.
export const EcranEnregistrer = () => {
  const navigation = useNavigation<any>();

  const gererDemarrer = () => {
    navigation.navigate('SuiviMouvement');
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.contenu}>
          <Text style={styles.titre}>SESSION</Text>

          <View style={styles.carteInfo}>
            <Text style={styles.titreInfo}>Tracker mouvement et vitesse</Text>
            <Text style={styles.texteInfo}>
              Appuie sur Démarrer pour ouvrir le suivi en temps réel.
            </Text>
          </View>

          <View style={styles.ligneBoutons}>
            <TouchableOpacity
              style={[styles.bouton, styles.boutonPrimaire]}
              onPress={gererDemarrer}>
              <Text style={styles.texteBoutonPrimaire}>Démarrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  contenu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.xl,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 48,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.xl,
  },
  carteInfo: {
    width: '100%',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    marginBottom: theme.espacement.xl,
  },
  titreInfo: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.md,
  },
  texteInfo: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  ligneBoutons: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.espacement.md,
  },
  bouton: {
    flex: 1,
    minHeight: 56,
    borderRadius: theme.rayonBordure.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  boutonPrimaire: {
    backgroundColor: theme.couleurs.boutonPrimaire,
  },
  boutonSecondaire: {
    borderWidth: 2,
    borderColor: theme.couleurs.bordure,
    backgroundColor: 'transparent',
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  texteBoutonPrimaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  texteBoutonSecondaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteClair,
  },
});
