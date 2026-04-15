import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {Dashboard, useSuiviMouvement} from '../../fonctionnalites/suiviMouvement';
import {theme} from '../../styles/theme';

export const EcranSuiviMouvement = () => {
  const navigation = useNavigation<any>();

  // Pour que ça marche tout de suite dans ton projet React Native CLI, on démarre en simulation.
  // Quand tu seras prêt à brancher les vrais capteurs, on pourra passer à false + implémenter deviceSensors.ts.
  const [modeSimulation] = useState(true);

  const {etat, demarrer, arreter} = useSuiviMouvement({
    simulation: modeSimulation,
    config: {
      intervalleSondageMs: 1000,
      capteursActifs: {
        gps: true,
        podometre: true,
        accelerometre: true,
      },
    },
  });

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.barreHaut}>
          <TouchableOpacity
            style={styles.boutonRetour}
            onPress={() => navigation.goBack()}>
            <Text style={styles.texteRetour}>Retour</Text>
          </TouchableOpacity>
          <View style={styles.titreBox}>
            <Text style={styles.titre}>Suivi</Text>
            {modeSimulation ? (
              <Text style={styles.sousTitre}>Mode simulation</Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}>
          <Dashboard
            etat={etat}
            estActif={etat.estActif}
            onDemarrer={demarrer}
            onArreter={arreter}
            modeSimulation={modeSimulation}
          />
        </ScrollView>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  barreHaut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.lg,
    paddingBottom: theme.espacement.md,
    gap: theme.espacement.md,
  },
  boutonRetour: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.rayonBordure.md,
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
  },
  texteRetour: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 16,
  },
  titreBox: {
    flex: 1,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 22,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteSecondaire,
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.espacement.xl,
  },
});
