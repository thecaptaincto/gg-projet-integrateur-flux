import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

// Tableau de bord principal affiché après la connexion.
// Le nom affiché dans la salutation est extrait de la partie locale du courriel
// (avant le @), faute d'un displayName systématiquement renseigné.
export const EcranPrincipal = () => {
  const {utilisateur} = utiliserAuth();

  const activitesRecentes = useMemo(
    () => [
      {
        id: 'a1',
        type: 'Vélo',
        icone: '🚴',
        date: '24 mars 2026',
        dureeSecondes: 42 * 60 + 18,
        distanceKm: 18.6,
      },
      {
        id: 'a2',
        type: 'Course',
        icone: '🏃',
        date: '22 mars 2026',
        dureeSecondes: 28 * 60 + 4,
        distanceKm: 5.2,
      },
      {
        id: 'a3',
        type: 'Marche',
        icone: '🚶',
        date: '20 mars 2026',
        dureeSecondes: 85 * 60 + 2,
        distanceKm: 6.7,
      },
    ],
    [],
  );

  const formaterDuree = (totalSecondes: number): string => {
    const heures = Math.floor(totalSecondes / 3600);
    const minutes = Math.floor((totalSecondes % 3600) / 60);
    const secondes = totalSecondes % 60;

    if (heures > 0) {
      return `${heures}h ${String(minutes).padStart(2, '0')}m`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(
      2,
      '0',
    )}`;
  };

  const vitesseMoyenne = (distanceKm: number, dureeSecondes: number): number => {
    if (dureeSecondes <= 0) {
      return 0;
    }
    return distanceKm / (dureeSecondes / 3600);
  };

  const statsSemaine = useMemo(() => {
    const nbSessions = activitesRecentes.length;
    const distanceTotale = activitesRecentes.reduce(
      (total, a) => total + a.distanceKm,
      0,
    );
    const tempsTotalSecondes = activitesRecentes.reduce(
      (total, a) => total + a.dureeSecondes,
      0,
    );

    return {nbSessions, distanceTotale, tempsTotalSecondes};
  }, [activitesRecentes]);

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>FLUX</Text>
          <Text style={styles.salutation}>
            Bienvenue, {utilisateur?.email?.split('@')[0] || 'Utilisateur'}!
          </Text>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Statistiques de la semaine</Text>
            <View style={styles.grilleStats}>
              <View style={styles.carteStat}>
                <Text style={styles.valeurStat}>{statsSemaine.nbSessions}</Text>
                <Text style={styles.libelleStat}>Sessions</Text>
              </View>
              <View style={styles.carteStat}>
                <Text style={styles.valeurStat}>
                  {statsSemaine.distanceTotale.toFixed(1)}
                </Text>
                <Text style={styles.libelleStat}>km</Text>
              </View>
              <View style={styles.carteStat}>
                <Text style={styles.valeurStat}>
                  {formaterDuree(statsSemaine.tempsTotalSecondes)}
                </Text>
                <Text style={styles.libelleStat}>Temps</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Dernières activités</Text>
            {activitesRecentes.slice(0, 3).map(activite => {
              const vm = vitesseMoyenne(
                activite.distanceKm,
                activite.dureeSecondes,
              );

              return (
                <View key={activite.id} style={styles.carteActivite}>
                  <View style={styles.iconeActivite}>
                    <Text style={styles.texteIconeActivite}>
                      {activite.icone}
                    </Text>
                  </View>

                  <View style={styles.contenuActivite}>
                    <View style={styles.ligneActivite}>
                      <Text style={styles.titreActivite}>{activite.type}</Text>
                      <Text style={styles.dateActivite}>{activite.date}</Text>
                    </View>

                    <View style={styles.ligneDetails}>
                      <Text style={styles.detailActivite}>
                        {formaterDuree(activite.dureeSecondes)}
                      </Text>
                      <Text style={styles.separateur}>•</Text>
                      <Text style={styles.detailActivite}>
                        {activite.distanceKm.toFixed(1)} km
                      </Text>
                      <Text style={styles.separateur}>•</Text>
                      <Text style={styles.detailActivite}>
                        {vm.toFixed(1)} km/h
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
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
  section: {
    marginBottom: theme.espacement.xl,
  },
  titreSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.sm,
  },
  grilleStats: {
    flexDirection: 'row',
    gap: theme.espacement.md,
  },
  carteStat: {
    flex: 1,
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    paddingVertical: theme.espacement.lg,
    paddingHorizontal: theme.espacement.md,
    alignItems: 'center',
  },
  valeurStat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 26,
    color: theme.couleurs.primaire,
    marginBottom: 4,
  },
  libelleStat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
  },
  carteActivite: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    marginBottom: theme.espacement.md,
  },
  iconeActivite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 226, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.espacement.md,
  },
  texteIconeActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
  },
  contenuActivite: {
    flex: 1,
  },
  ligneActivite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titreActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texte,
  },
  dateActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
  },
  ligneDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteClair,
  },
  separateur: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: 'rgba(253, 226, 255, 0.5)',
  },
});
