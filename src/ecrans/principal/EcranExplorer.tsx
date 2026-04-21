import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Écran de découverte de contenu.
// La grille de catégories utilise flexWrap pour s'adapter automatiquement
// à la largeur de l'écran : chaque carte occupe ~47% de la largeur disponible,
// formant ainsi deux colonnes sans calcul de largeur fixe.
export const EcranExplorer = () => {
  const navigation = useNavigation<any>();
  const [modeSimulation, setModeSimulation] = React.useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem('mode_simulation')
      .then(v => {
        if (v === null) return;
        setModeSimulation(v === 'true');
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const definirModeSimulation = async (valeur: boolean) => {
    setModeSimulation(valeur);
    try {
      await AsyncStorage.setItem('mode_simulation', valeur ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const demarrerFlux = (preset: string) => {
    navigation.navigate('SuiviMouvement', {preset, simulation: modeSimulation});
  };

  const fluxRecommandes = [
    {titre: 'Marche', sousTitre: 'Démarrage facile'},
    {titre: 'Course', sousTitre: 'Rythme libre'},
    {titre: 'Sport', sousTitre: 'Session entraînement'},
    {titre: 'Mystère', sousTitre: 'Surprise du jour'},
  ];

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>EXPLORER</Text>

          <View style={styles.section}>
            <View style={styles.ligneMode}>
              <View style={styles.modeTexte}>
                <Text style={styles.titreSection}>Mode</Text>
                <Text style={styles.sousTitre}>
                  {modeSimulation ? 'Simulation' : 'Capteurs réels'}
                </Text>
              </View>
              <Switch
                value={modeSimulation}
                onValueChange={val => void definirModeSimulation(val)}
                trackColor={{
                  false: 'rgba(253, 226, 255, 0.25)',
                  true: theme.couleurs.violetAccent,
                }}
                thumbColor={theme.couleurs.primaire}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Catégories</Text>
            <View style={styles.grilleCategories}>
              {fluxRecommandes.map(item => (
                <TouchableOpacity
                  key={item.titre}
                  style={styles.carteCategorie}
                  activeOpacity={0.85}
                  onPress={() => demarrerFlux(item.titre)}>
                  <Text style={styles.texteCategorie}>{item.titre}</Text>
                  <Text style={styles.texteCategorieSousTitre}>
                    {item.sousTitre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Que faire maintenant?</Text>
            <TouchableOpacity
              style={styles.carte}
              activeOpacity={0.85}
              onPress={() => demarrerFlux('Découverte')}>
              <Text style={styles.texteCarte}>Découvrez les nouveaux flux</Text>
              <Text style={styles.texteCarteSousTitre}>
                Lance une session rapide et commence à accumuler des stats.
              </Text>
            </TouchableOpacity>
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
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginTop: 4,
  },
  ligneMode: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
  },
  modeTexte: {
    flex: 1,
    paddingRight: theme.espacement.md,
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
  texteCategorieSousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: 'rgba(253, 226, 255, 0.85)',
    marginTop: 6,
    textAlign: 'center',
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
    fontSize: 18,
    color: theme.couleurs.texteClair,
    textAlign: 'center',
  },
  texteCarteSousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
    marginTop: 8,
  },
});
