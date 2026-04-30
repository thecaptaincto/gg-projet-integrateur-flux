import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';
import {
  chargerEntrainements,
  type EntrainementSauvegarde,
} from '../../utils/stockageEntrainements';

function formaterDuree(totalSecondes: number): string {
  const heures = Math.floor(totalSecondes / 3600);
  const minutes = Math.floor((totalSecondes % 3600) / 60);

  if (heures > 0) {
    return `${heures}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${minutes} min`;
}

function formaterDistance(distanceMetres: number): string {
  if (distanceMetres >= 1000) {
    return `${(distanceMetres / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMetres)} m`;
}

function formaterDateCourte(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-CA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function estCetteSemaine(dateISO: string): boolean {
  const date = new Date(dateISO);
  const maintenant = new Date();
  const debutJour = new Date(maintenant);
  debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(debutJour);
  debutSemaine.setDate(debutJour.getDate() - debutJour.getDay());

  return date >= debutSemaine;
}

const suggestionsExplorer = [
  {
    titre: 'Marche',
    sousTitre: 'Relance légère',
    accent: '#d7b4ff',
    objectif: '10 à 20 minutes pour reprendre le rythme.',
  },
  {
    titre: 'Course',
    sousTitre: 'Cardio rapide',
    accent: '#ff93b7',
    objectif: 'Parfait pour une sortie plus soutenue.',
  },
  {
    titre: 'Sport',
    sousTitre: 'Session libre',
    accent: '#b98cff',
    objectif: 'Utilise tous les capteurs pendant l’effort.',
  },
  {
    titre: 'Découverte',
    sousTitre: 'Test express',
    accent: '#8d5cf6',
    objectif: 'Un démarrage simple pour valider le suivi.',
  },
] as const;

export const EcranExplorer = () => {
  const navigation = useNavigation<any>();
  const {utilisateur} = utiliserAuth();
  const [modeSimulation, setModeSimulation] = React.useState(true);
  const [entrainements, setEntrainements] = React.useState<EntrainementSauvegarde[]>(
    [],
  );

  React.useEffect(() => {
    AsyncStorage.getItem('mode_simulation')
      .then(v => {
        if (v === null) {
          return;
        }
        setModeSimulation(v === 'true');
      })
      .catch(() => {
        // ignore
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let actif = true;

      chargerEntrainements(utilisateur?.uid).then(liste => {
        if (actif) {
          setEntrainements(liste);
        }
      });

      return () => {
        actif = false;
      };
    }, [utilisateur?.uid]),
  );

  const definirModeSimulation = async (valeur: boolean) => {
    setModeSimulation(valeur);
    try {
      await AsyncStorage.setItem('mode_simulation', valeur ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const demarrerFlux = (suggestion: string) => {
    navigation.navigate('SuiviMouvement', {
      suggestion,
      simulation: modeSimulation,
    });
  };

  const allerHistorique = (periode?: 'jour' | 'semaine' | 'mois') => {
    navigation.navigate('Historique', periode ? {periode} : undefined);
  };

  const dernierEntrainement = entrainements[0];

  const resumeSemaine = useMemo(() => {
    const entrainementsSemaine = entrainements.filter(item =>
      estCetteSemaine(item.dateISO),
    );

    return entrainementsSemaine.reduce(
      (acc, item) => ({
        sessions: acc.sessions + 1,
        dureeSecondes: acc.dureeSecondes + item.dureeSecondes,
        distanceMetres: acc.distanceMetres + item.distanceMetres,
        nombrePas: acc.nombrePas + item.nombrePas,
      }),
      {
        sessions: 0,
        dureeSecondes: 0,
        distanceMetres: 0,
        nombrePas: 0,
      },
    );
  }, [entrainements]);

  const messageContextuel = useMemo(() => {
    if (resumeSemaine.sessions === 0) {
      return 'Commence une première session pour voir tes stats apparaître ici.';
    }

    if (resumeSemaine.sessions >= 4) {
      return 'Belle cadence cette semaine. Tu peux lancer une session rapide pour continuer.';
    }

    return 'Tu as déjà du mouvement cette semaine. Un petit entraînement de plus et la tendance grimpe vite.';
  }, [resumeSemaine.sessions]);

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView
          contentContainerStyle={styles.contenuScroll}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.titre}>EXPLORER</Text>

          <View style={styles.section}>
            <View style={styles.heroCarte}>
              <Text style={styles.heroSurTitre}>Aujourd’hui</Text>
              <Text style={styles.heroTitre}>Choisis un bon prochain départ</Text>
              <Text style={styles.heroTexte}>{messageContextuel}</Text>
              <TouchableOpacity
                style={styles.boutonHero}
                activeOpacity={0.85}
                onPress={() =>
                  demarrerFlux(
                    resumeSemaine.sessions === 0 ? 'Découverte' : 'Marche',
                  )
                }>
                <Text style={styles.boutonHeroTexte}>
                  {resumeSemaine.sessions === 0
                    ? 'Commencer'
                    : 'Lancer une session'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.ligneMode}>
              <View style={styles.modeTexte}>
                <Text style={styles.titreSection}>Mode de suivi</Text>
                <Text style={styles.sousTitre}>
                  {modeSimulation
                    ? 'Simulation activée pour tester rapidement.'
                    : 'Capteurs réels activés pour un suivi complet.'}
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
            <Text style={styles.titreSection}>Résumé de la semaine</Text>
            <View style={styles.grilleResume}>
              <View style={styles.carteResume}>
                <Text style={styles.valeurResume}>{resumeSemaine.sessions}</Text>
                <Text style={styles.libelleResume}>Sessions</Text>
              </View>
              <View style={styles.carteResume}>
                <Text style={styles.valeurResume}>
                  {formaterDuree(resumeSemaine.dureeSecondes)}
                </Text>
                <Text style={styles.libelleResume}>Durée</Text>
              </View>
              <View style={styles.carteResume}>
                <Text style={styles.valeurResume}>
                  {formaterDistance(resumeSemaine.distanceMetres)}
                </Text>
                <Text style={styles.libelleResume}>Distance</Text>
              </View>
              <View style={styles.carteResume}>
                <Text style={styles.valeurResume}>{resumeSemaine.nombrePas}</Text>
                <Text style={styles.libelleResume}>Pas</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionEntete}>
              <Text style={styles.titreSection}>Démarrages rapides</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => demarrerFlux('Découverte')}>
                <Text style={styles.lienSection}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grilleCategories}>
              {suggestionsExplorer.map(item => (
                <TouchableOpacity
                  key={item.titre}
                  style={styles.carteCategorie}
                  activeOpacity={0.85}
                  onPress={() => demarrerFlux(item.titre)}>
                  <View
                    style={[
                      styles.pastilleAccent,
                      {backgroundColor: item.accent},
                    ]}
                  />
                  <Text style={styles.texteCategorie}>{item.titre}</Text>
                  <Text style={styles.texteCategorieSousTitre}>
                    {item.sousTitre}
                  </Text>
                  <Text style={styles.texteCategorieObjectif}>
                    {item.objectif}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Raccourcis utiles</Text>
            <View style={styles.actionsRapides}>
              <TouchableOpacity
                style={styles.carteAction}
                activeOpacity={0.85}
                onPress={() => allerHistorique('jour')}>
                <Text style={styles.texteCarte}>Aujourd’hui</Text>
                <Text style={styles.texteCarteSousTitre}>
                  Voir les sessions du jour.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.carteAction}
                activeOpacity={0.85}
                onPress={() => allerHistorique('semaine')}>
                <Text style={styles.texteCarte}>Cette semaine</Text>
                <Text style={styles.texteCarteSousTitre}>
                  Revoir la progression récente.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.carteAction}
                activeOpacity={0.85}
                onPress={() => allerHistorique()}>
                <Text style={styles.texteCarte}>Historique complet</Text>
                <Text style={styles.texteCarteSousTitre}>
                  Retrouver toutes les sessions sauvegardées.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Dernière activité</Text>
            {dernierEntrainement ? (
              <TouchableOpacity
                style={styles.carteDerniereActivite}
                activeOpacity={0.85}
                onPress={() => allerHistorique()}>
                <View style={styles.ligneDerniereActivite}>
                  <View style={styles.dernierBlocTexte}>
                    <Text style={styles.dernierTitre} numberOfLines={1}>
                      {dernierEntrainement.nom}
                    </Text>
                    <Text style={styles.dernierDate}>
                      {formaterDateCourte(dernierEntrainement.dateISO)}
                    </Text>
                  </View>
                  <Text style={styles.dernierVitesse}>
                    {dernierEntrainement.vitesseMoyenneKmh.toFixed(1)} km/h
                  </Text>
                </View>
                <View style={styles.resumeDerniereActivite}>
                  <View style={styles.resumePuce}>
                    <Text style={styles.resumePuceValeur}>
                      {formaterDuree(dernierEntrainement.dureeSecondes)}
                    </Text>
                    <Text style={styles.resumePuceLibelle}>Durée</Text>
                  </View>
                  <View style={styles.resumePuce}>
                    <Text style={styles.resumePuceValeur}>
                      {formaterDistance(dernierEntrainement.distanceMetres)}
                    </Text>
                    <Text style={styles.resumePuceLibelle}>Distance</Text>
                  </View>
                  <View style={styles.resumePuce}>
                    <Text style={styles.resumePuceValeur}>
                      {dernierEntrainement.nombrePas}
                    </Text>
                    <Text style={styles.resumePuceLibelle}>Pas</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.carteVide}>
                <Text style={styles.texteCarte}>Pas encore d’activité</Text>
                <Text style={styles.texteCarteSousTitre}>
                  Lance une première session pour remplir cet espace avec des
                  stats utiles.
                </Text>
              </View>
            )}
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
    marginBottom: theme.espacement.lg,
  },
  section: {
    marginBottom: theme.espacement.xl,
  },
  heroCarte: {
    backgroundColor: 'rgba(253, 226, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.28)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
  heroSurTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    marginBottom: 6,
  },
  heroTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 28,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.sm,
  },
  heroTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    lineHeight: 20,
    color: theme.couleurs.texteSecondaire,
    marginBottom: theme.espacement.md,
  },
  boutonHero: {
    alignSelf: 'flex-start',
    backgroundColor: theme.couleurs.boutonPrimaire,
    borderRadius: theme.rayonBordure.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  boutonHeroTexte: {
    fontFamily: theme.polices.grasse,
    fontSize: 15,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  titreSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texteClair,
    marginBottom: theme.espacement.md,
  },
  sectionEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.espacement.md,
    marginBottom: theme.espacement.md,
  },
  lienSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.primaire,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginTop: 4,
    lineHeight: 18,
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
  grilleResume: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.md,
  },
  carteResume: {
    width: '47%',
    backgroundColor: 'rgba(253, 226, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.24)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
  },
  valeurResume: {
    fontFamily: theme.polices.grasse,
    fontSize: 24,
    color: theme.couleurs.texte,
  },
  libelleResume: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    marginTop: 6,
  },
  grilleCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.md,
  },
  carteCategorie: {
    backgroundColor: theme.couleurs.surfaceForte,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureSubtile,
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    width: '47%',
    minHeight: 168,
  },
  pastilleAccent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: theme.espacement.sm,
  },
  texteCategorie: {
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texte,
  },
  texteCategorieSousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.accentLilas,
    marginTop: 4,
  },
  texteCategorieObjectif: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    marginTop: theme.espacement.sm,
    lineHeight: 17,
  },
  actionsRapides: {
    gap: theme.espacement.md,
  },
  carteAction: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
  texteCarte: {
    fontFamily: theme.polices.grasse,
    fontSize: 18,
    color: theme.couleurs.texteClair,
  },
  texteCarteSousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    marginTop: 8,
    lineHeight: 18,
  },
  carteDerniereActivite: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
  ligneDerniereActivite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.espacement.md,
  },
  dernierBlocTexte: {
    flex: 1,
  },
  dernierTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.texte,
  },
  dernierDate: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    marginTop: 4,
  },
  dernierVitesse: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.primaire,
  },
  resumeDerniereActivite: {
    flexDirection: 'row',
    gap: theme.espacement.sm,
    marginTop: theme.espacement.md,
  },
  resumePuce: {
    flex: 1,
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderRadius: theme.rayonBordure.sm,
    paddingVertical: theme.espacement.sm,
    paddingHorizontal: 10,
  },
  resumePuceValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 14,
    color: theme.couleurs.texte,
  },
  resumePuceLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 11,
    color: theme.couleurs.texteSecondaire,
    marginTop: 4,
  },
  carteVide: {
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.22)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
  },
});
