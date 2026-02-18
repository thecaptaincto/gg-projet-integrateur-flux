import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

export const EcranNotifications = () => {
  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>NOTIFICATIONS</Text>

          <View style={styles.carteNotification}>
            <View style={styles.badge} />
            <View style={styles.contenuNotification}>
              <Text style={styles.titreNotification}>Nouvelle notification</Text>
              <Text style={styles.texteNotification}>
                Vous avez une nouvelle activité
              </Text>
              <Text style={styles.heureNotification}>Il y a 5 min</Text>
            </View>
          </View>

          <View style={styles.carteNotification}>
            <View style={[styles.badge, styles.badgeLu]} />
            <View style={styles.contenuNotification}>
              <Text style={styles.titreNotification}>Mise à jour</Text>
              <Text style={styles.texteNotification}>
                Découvrez les nouvelles fonctionnalités
              </Text>
              <Text style={styles.heureNotification}>Il y a 2 heures</Text>
            </View>
          </View>

          <View style={styles.etatVide}>
            <Text style={styles.texteVide}>
              Aucune autre notification
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
    marginBottom: theme.espacement.xl,
  },
  carteNotification: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    marginBottom: theme.espacement.md,
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.couleurs.primaire,
    marginRight: theme.espacement.md,
    marginTop: 4,
  },
  badgeLu: {
    backgroundColor: 'rgba(253, 226, 255, 0.3)',
  },
  contenuNotification: {
    flex: 1,
  },
  titreNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texte,
    marginBottom: 4,
  },
  texteNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteClair,
    marginBottom: 4,
  },
  heureNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: 'rgba(253, 226, 255, 0.6)',
  },
  etatVide: {
    marginTop: theme.espacement.xl,
    alignItems: 'center',
  },
  texteVide: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: 'rgba(253, 226, 255, 0.5)',
  },
});