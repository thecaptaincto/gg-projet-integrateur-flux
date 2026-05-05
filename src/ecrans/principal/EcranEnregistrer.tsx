import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {
  CAPTEURS_REELS_DISPONIBLES,
  MESSAGE_CAPTEURS_REELS_INDISPONIBLES,
} from '../../fonctionnalites/suiviMouvement/sensors/deviceSensors';
import {theme} from '../../styles/theme';

export const EcranEnregistrer = () => {
  const navigation = useNavigation<any>();

  const demarrer = (suggestion?: string, simulation?: boolean) => {
    navigation.navigate('SuiviMouvement', {suggestion, simulation});
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.contenu}>
          <Text style={styles.titre}>SESSION</Text>
          <Text style={styles.sousTitre}>
            Prépare une séance rapide ou lance directement le suivi complet.
          </Text>

          <View style={styles.carteInfo}>
            <Text style={styles.titreInfo}>Suivre le mouvement et la vitesse</Text>
            <Text style={styles.texteInfo}>
              Le mode simulation est idéal pour une démo. Les capteurs réels sont
              utiles pour une vraie session.
            </Text>
          </View>

          <View style={styles.grilleSuggestions}>
            <TouchableOpacity
              style={styles.carteSuggestion}
              onPress={() => demarrer('Découverte', true)}>
              <Text style={styles.suggestionTitre}>Démo rapide</Text>
              <Text style={styles.suggestionTexte}>
                Lance une session en simulation pour montrer le suivi sans te déplacer.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.carteSuggestion,
                !CAPTEURS_REELS_DISPONIBLES && styles.carteDesactivee,
              ]}
              disabled={!CAPTEURS_REELS_DISPONIBLES}
              onPress={() => demarrer('Course', false)}>
              <Text style={styles.suggestionTitre}>Session réelle</Text>
              <Text style={styles.suggestionTexte}>
                {CAPTEURS_REELS_DISPONIBLES
                  ? 'Utilise les capteurs de l’appareil pour une sortie complète.'
                  : MESSAGE_CAPTEURS_REELS_INDISPONIBLES}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ligneBoutons}>
            <TouchableOpacity
              style={[styles.bouton, styles.boutonPrimaire]}
              onPress={() => demarrer('Libre', true)}>
              <Text style={styles.texteBoutonPrimaire}>Démarrer une démo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ligneBoutons}>
            <TouchableOpacity
              style={[styles.bouton, styles.boutonSecondaire]}
              disabled={!CAPTEURS_REELS_DISPONIBLES}
              onPress={() => demarrer('Libre', false)}>
              <Text style={styles.texteBoutonSecondaire}>Démarrer en réel</Text>
            </TouchableOpacity>
          </View>

          {!CAPTEURS_REELS_DISPONIBLES ? (
            <Text style={styles.noteDemo}>
              Pour l’EXPO-SIM, la version la plus fiable est le mode simulation.
            </Text>
          ) : null}
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
    marginBottom: theme.espacement.sm,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    lineHeight: 22,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
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
  grilleSuggestions: {
    width: '100%',
    gap: theme.espacement.md,
    marginBottom: theme.espacement.xl,
  },
  carteSuggestion: {
    width: '100%',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.22)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
  suggestionTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 20,
    color: theme.couleurs.texte,
    marginBottom: 8,
  },
  suggestionTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 15,
    lineHeight: 21,
    color: theme.couleurs.texteSecondaire,
  },
  ligneBoutons: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.espacement.md,
    marginBottom: theme.espacement.md,
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
  carteDesactivee: {
    opacity: 0.55,
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
  noteDemo: {
    marginTop: theme.espacement.sm,
    textAlign: 'center',
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    lineHeight: 20,
    color: theme.couleurs.texteSecondaire,
  },
});
