import React, {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {
  TableauDeBordSuivi,
  useSuiviMouvement,
} from '../../fonctionnalites/suiviMouvement';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {utiliserNotifications} from '../../contextes/ContexteNotifications';
import {theme} from '../../styles/theme';
import {sauvegarderEntrainement} from '../../utils/stockageEntrainements';

function formaterDureeResume(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const EcranSuiviMouvement = () => {
  const {utilisateur} = utiliserAuth();
  const {ajouterNotificationSysteme} = utiliserNotifications();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const suggestion =
    (route.params?.suggestion as string | undefined) ?? undefined;
  const [modeSimulation] = useState<boolean>(
    (route.params?.simulation as boolean | undefined) ?? true,
  );
  const [nomEntrainement, setNomEntrainement] = useState('');
  const inputRef = useRef<TextInput>(null);

  const {etat, demarrer, arreter, pauseReprendre, resumeSession, effacerResume} =
    useSuiviMouvement({
      simulation: modeSimulation,
      config: {
        intervalleSondageMs: 1000,
        capteursActifs: {gps: true, podometre: true, accelerometre: true},
      },
    });

  // Pré-remplir le nom avec la date quand la modal apparaît
  useEffect(() => {
    if (resumeSession) {
      const maintenant = new Date();
      const dateStr = maintenant.toLocaleDateString('fr-CA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const base = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      setNomEntrainement(suggestion ? `${suggestion} — ${base}` : base);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [suggestion, resumeSession]);

  const sauvegarderResume = async () => {
    if (!resumeSession) {
      return;
    }
    const nom = nomEntrainement.trim() || 'Entraînement';
    await sauvegarderEntrainement(utilisateur?.uid, {
      nom,
      dateISO: new Date().toISOString(),
      dureeSecondes: resumeSession.dureeSecondes,
      distanceMetres: resumeSession.distanceMetres,
      nombrePas: resumeSession.nombrePas,
      vitesseMoyenneKmh: resumeSession.vitesseMoyenneKmh,
    });

    try {
      const notifsActivites = await AsyncStorage.getItem('notifs_activites');
      if (notifsActivites !== 'false') {
        await ajouterNotificationSysteme(
          'Entraînement sauvegardé',
          `${nom} a été enregistré avec ${resumeSession.nombrePas} pas et ${resumeSession.distanceMetres >= 1000 ? `${(resumeSession.distanceMetres / 1000).toFixed(2)} km` : `${Math.round(resumeSession.distanceMetres)} m`}.`,
          {type: 'entrainement-sauvegarde'},
        );
      }
    } catch {
      // ignore
    }

    effacerResume();
    setNomEntrainement('');
    navigation.goBack();
  };

  const ignorerResume = () => {
    effacerResume();
    setNomEntrainement('');
    navigation.goBack();
  };

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
          <TableauDeBordSuivi
            etat={etat}
            estActif={etat.estActif}
            onDemarrer={demarrer}
            onArreter={arreter}
            onPauseReprendre={pauseReprendre}
            modeSimulation={modeSimulation}
          />
        </ScrollView>

        {/* Modal de nommage de l'entraînement */}
        {resumeSession ? (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitre}>Entraînement terminé</Text>

              {/* Résumé rapide */}
              <View style={styles.resumeGrille}>
                <View style={styles.resumeItem}>
                  <Text style={styles.resumeValeur}>
                    {formaterDureeResume(resumeSession.dureeSecondes)}
                  </Text>
                  <Text style={styles.resumeLibelle}>Durée</Text>
                </View>
                <View style={styles.resumeItem}>
                  <Text style={styles.resumeValeur}>
                    {resumeSession.distanceMetres >= 1000
                      ? `${(resumeSession.distanceMetres / 1000).toFixed(2)} km`
                      : `${Math.round(resumeSession.distanceMetres)} m`}
                  </Text>
                  <Text style={styles.resumeLibelle}>Distance</Text>
                </View>
                <View style={styles.resumeItem}>
                  <Text style={styles.resumeValeur}>{resumeSession.nombrePas}</Text>
                  <Text style={styles.resumeLibelle}>Pas</Text>
                </View>
              </View>

              <Text style={styles.modalLabel}>Nom de l'entraînement</Text>
              <TextInput
                ref={inputRef}
                style={styles.champNom}
                value={nomEntrainement}
                onChangeText={setNomEntrainement}
                placeholder="Ex: Course matinale"
                placeholderTextColor={theme.couleurs.placeholder}
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={sauvegarderResume}
              />

              <TouchableOpacity
                style={styles.boutonSauvegarder}
                onPress={sauvegarderResume}>
                <Text style={styles.boutonSauvegarderTexte}>Sauvegarder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.boutonIgnorer}
                onPress={ignorerResume}>
                <Text style={styles.boutonIgnorerTexte}>Ne pas sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1},
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
  titreBox: {flex: 1},
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
  scroll: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.espacement.xl,
  },
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.couleurs.overlayModal,
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.lg,
  },
  modalBox: {
    backgroundColor: theme.couleurs.milieuGradient,
    borderRadius: theme.rayonBordure.lg,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureTransparente,
    padding: theme.espacement.lg,
  },
  modalTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 26,
    color: theme.couleurs.texte,
    textAlign: 'center',
    marginBottom: theme.espacement.md,
  },
  resumeGrille: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.espacement.lg,
  },
  resumeItem: {alignItems: 'center'},
  resumeValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.primaire,
  },
  resumeLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    marginTop: 2,
  },
  modalLabel: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginBottom: theme.espacement.xs,
  },
  champNom: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texte,
    backgroundColor: theme.couleurs.champFond,
    borderWidth: 2,
    borderColor: theme.couleurs.champBordure,
    borderRadius: theme.rayonBordure.md,
    paddingHorizontal: theme.espacement.md,
    paddingVertical: theme.espacement.sm,
    marginBottom: theme.espacement.md,
  },
  boutonSauvegarder: {
    backgroundColor: theme.couleurs.boutonPrimaire,
    borderRadius: theme.rayonBordure.md,
    paddingVertical: theme.espacement.md,
    alignItems: 'center',
    marginBottom: theme.espacement.sm,
  },
  boutonSauvegarderTexte: {
    fontFamily: theme.polices.grasse,
    fontSize: 16,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  boutonIgnorer: {
    paddingVertical: theme.espacement.sm,
    alignItems: 'center',
  },
  boutonIgnorerTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
  },
});
