import React, {useCallback, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';
import {
  chargerEntrainements,
  type EntrainementSauvegarde,
} from '../../utils/stockageEntrainements';

type PeriodeStats = 'jour' | 'semaine' | 'mois';

function formaterDuree(totalSecondes: number): string {
  const heures = Math.floor(totalSecondes / 3600);
  const minutes = Math.floor((totalSecondes % 3600) / 60);
  const secondes = totalSecondes % 60;
  if (heures > 0) {
    return `${heures}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
}

function formaterDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function estDansPeriode(dateISO: string, periode: PeriodeStats): boolean {
  const date = new Date(dateISO);
  const maintenant = new Date();
  const debutJour = new Date(maintenant);
  debutJour.setHours(0, 0, 0, 0);

  if (periode === 'jour') {
    return date >= debutJour;
  }
  if (periode === 'semaine') {
    const debutSemaine = new Date(debutJour);
    debutSemaine.setDate(debutJour.getDate() - debutJour.getDay());
    return date >= debutSemaine;
  }
  // mois
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  return date >= debutMois;
}

const ETIQUETTES_PERIODE: Record<PeriodeStats, string> = {
  jour: "Aujourd'hui",
  semaine: 'Semaine',
  mois: 'Mois',
};

export const EcranPrincipal = () => {
  const {utilisateur} = utiliserAuth();
  const navigation = useNavigation<any>();
  const [periode, setPeriode] = useState<PeriodeStats>('semaine');
  const [entrainements, setEntrainements] = useState<EntrainementSauvegarde[]>([]);

  // Recharger à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      chargerEntrainements().then(setEntrainements);
    }, []),
  );

  const entrainementsPeriode = entrainements.filter(e =>
    estDansPeriode(e.dateISO, periode),
  );

  const stats = {
    nbSessions: entrainementsPeriode.length,
    distanceTotaleKm: entrainementsPeriode.reduce(
      (acc, e) => acc + e.distanceMetres / 1000,
      0,
    ),
    tempsTotalSecondes: entrainementsPeriode.reduce(
      (acc, e) => acc + e.dureeSecondes,
      0,
    ),
  };

  const recents = entrainements.slice(0, 5);

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>FLUX</Text>
          <Text style={styles.salutation}>
            Bienvenue, {utilisateur?.email?.split('@')[0] || 'Utilisateur'}!
          </Text>

          {/* Section statistiques */}
          <View style={styles.section}>
            <View style={styles.enteteSection}>
              <Text style={styles.titreSection}>Statistiques</Text>
              <View style={styles.toggleRow}>
                {(['jour', 'semaine', 'mois'] as PeriodeStats[]).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.toggleBouton,
                      periode === p && styles.toggleBoutonActif,
                    ]}
                    onPress={() => setPeriode(p)}>
                    <Text
                      style={[
                        styles.toggleTexte,
                        periode === p && styles.toggleTexteActif,
                      ]}>
                      {ETIQUETTES_PERIODE[p]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {stats.nbSessions === 0 ? (
              <Text style={styles.aucuneDonnee}>
                Aucun entraînement pour cette période.
              </Text>
            ) : (
              <View style={styles.grilleStats}>
                <View style={styles.carteStat}>
                  <Text style={styles.valeurStat}>{stats.nbSessions}</Text>
                  <Text style={styles.libelleStat}>Sessions</Text>
                </View>
                <View style={styles.carteStat}>
                  <Text style={styles.valeurStat}>
                    {stats.distanceTotaleKm.toFixed(1)}
                  </Text>
                  <Text style={styles.libelleStat}>km</Text>
                </View>
                <View style={styles.carteStat}>
                  <Text style={styles.valeurStat}>
                    {formaterDuree(stats.tempsTotalSecondes)}
                  </Text>
                  <Text style={styles.libelleStat}>Temps</Text>
                </View>
              </View>
            )}
          </View>

          {/* Section activités récentes */}
          <View style={styles.section}>
            <View style={styles.enteteSection}>
              <Text style={styles.titreSection}>Dernières activités</Text>
              {entrainements.length > 0 ? (
                <TouchableOpacity onPress={() => navigation.navigate('Historique')}>
                  <Text style={styles.lienHistorique}>Voir tout</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {recents.length === 0 ? (
              <Text style={styles.aucuneDonnee}>
                Lance ton premier entraînement pour le voir ici.
              </Text>
            ) : (
              recents.map(entrainement => (
                <View key={entrainement.id} style={styles.carteActivite}>
                  <View style={styles.iconeActivite}>
                    <Text style={styles.texteIconeActivite}>🏃</Text>
                  </View>
                  <View style={styles.contenuActivite}>
                    <View style={styles.ligneActivite}>
                      <Text style={styles.titreActivite} numberOfLines={1}>
                        {entrainement.nom}
                      </Text>
                      <Text style={styles.dateActivite}>
                        {formaterDate(entrainement.dateISO)}
                      </Text>
                    </View>
                    <View style={styles.ligneDetails}>
                      <Text style={styles.detailActivite}>
                        {formaterDuree(entrainement.dureeSecondes)}
                      </Text>
                      <Text style={styles.separateur}>•</Text>
                      <Text style={styles.detailActivite}>
                        {entrainement.distanceMetres >= 1000
                          ? `${(entrainement.distanceMetres / 1000).toFixed(2)} km`
                          : `${Math.round(entrainement.distanceMetres)} m`}
                      </Text>
                      <Text style={styles.separateur}>•</Text>
                      <Text style={styles.detailActivite}>
                        {entrainement.nombrePas} pas
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1},
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
  enteteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.espacement.sm,
    flexWrap: 'wrap',
    gap: theme.espacement.sm,
  },
  titreSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texte,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderRadius: theme.rayonBordure.sm,
    borderWidth: 1,
    borderColor: 'rgba(253,226,255,0.2)',
    overflow: 'hidden',
  },
  toggleBouton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleBoutonActif: {
    backgroundColor: theme.couleurs.violetAccent,
  },
  toggleTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
  },
  toggleTexteActif: {
    color: theme.couleurs.texte,
  },
  aucuneDonnee: {
    fontFamily: theme.polices.reguliere,
    fontSize: 15,
    color: theme.couleurs.placeholder,
    fontStyle: 'italic',
    paddingVertical: theme.espacement.md,
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
  lienHistorique: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.violetAccent,
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
  contenuActivite: {flex: 1},
  ligneActivite: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: theme.espacement.sm,
  },
  titreActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texte,
    flex: 1,
  },
  dateActivite: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
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
