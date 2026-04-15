import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

// Écran de découverte de contenu.
// La grille de catégories utilise flexWrap pour s'adapter automatiquement
// à la largeur de l'écran : chaque carte occupe ~47% de la largeur disponible,
// formant ainsi deux colonnes sans calcul de largeur fixe.
export const EcranExplorer = () => {
  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>EXPLORER</Text>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Catégories</Text>
            <View style={styles.grilleCategories}>
              <View style={styles.carteCategorie}>
                <Text style={styles.texteCategorie}>Marche</Text>
              </View>
              <View style={styles.carteCategorie}>
                <Text style={styles.texteCategorie}>Course</Text>
              </View>
              <View style={styles.carteCategorie}>
                <Text style={styles.texteCategorie}>Sport</Text>
              </View>
              <View style={styles.carteCategorie}>
                <Text style={styles.texteCategorie}>Mystère</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Que faire maintenant?</Text>
            <View style={styles.carte}>
              <Text style={styles.texteCarte}>
                Découvrez les nouveaux flux
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  contenuScroll: {
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.lg,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 48,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.xl,
  },
  section: {
    marginBottom: theme.espacement.xl,
  },
  titreSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texteClair,
    marginBottom: theme.espacement.md,
  },
  grilleCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.md,
  },
  carteCategorie: {
    backgroundColor: 'rgba(253, 226, 255, 0.15)',
    borderWidth: 2,
    borderColor: theme.couleurs.bordure,
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    width: '47%',
    alignItems: 'center',
  },
  texteCategorie: {
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texte,
  },
  carte: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
  texteCarte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteClair,
    textAlign: 'center',
  },
});
