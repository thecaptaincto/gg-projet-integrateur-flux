import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

export const EcranPrincipal = () => {
  const {utilisateur} = utiliserAuth();

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>FLUX</Text>
          <Text style={styles.salutation}>
            Bienvenue, {utilisateur?.email?.split('@')[0] || 'Utilisateur'}!
          </Text>

          <View style={styles.carte}>
            <Text style={styles.titreCarte}>Fil d'actualité</Text>
            <Text style={styles.texteCarte}>
              Découvrez les dernières publications de votre communauté
            </Text>
          </View>

          <View style={styles.carte}>
            <Text style={styles.titreCarte}>Suggestions</Text>
            <Text style={styles.texteCarte}>
              Explorez du nouveau contenu personnalisé pour vous
            </Text>
          </View>

          <View style={styles.carte}>
            <Text style={styles.titreCarte}>Tendances</Text>
            <Text style={styles.texteCarte}>
              Restez à jour avec ce qui est populaire
            </Text>
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
    marginBottom: theme.espacement.sm,
  },
  salutation: {
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texteClair,
    marginBottom: theme.espacement.xl,
  },
  carte: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    marginBottom: theme.espacement.md,
  },
  titreCarte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.sm,
  },
  texteCarte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteClair,
    lineHeight: 22,
  },
});