import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

export const EcranEnregistrer = () => {
  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.contenu}>
          <Text style={styles.titre}>Enregistrer votre progrès</Text>

          <TouchableOpacity style={styles.boutonDemarrer} onPress={() => {}}>
            <Text style={styles.texteBouton}>Démarrer!</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.lg,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 32,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.sm,
  },
  boutonDemarrer: {
    marginTop: 48,
    backgroundColor: theme.couleurs.boutonPrimaire,
    borderRadius: 999,
    paddingHorizontal: 36,
    minWidth: 220,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  texteBouton: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteBoutonPrimaire,
  },
});

