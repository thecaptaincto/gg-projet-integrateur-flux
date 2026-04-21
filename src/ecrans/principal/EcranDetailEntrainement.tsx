import React, {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';
import {
  chargerEntrainements,
  type EntrainementSauvegarde,
} from '../../utils/stockageEntrainements';

function formaterDateLongue(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formaterDuree(totalSecondes: number): string {
  const h = Math.floor(totalSecondes / 3600);
  const m = Math.floor((totalSecondes % 3600) / 60);
  const s = totalSecondes % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formaterAllure(distanceMetres: number, dureeSecondes: number): string {
  if (distanceMetres <= 0) return '--';
  const secParKm = dureeSecondes / (distanceMetres / 1000);
  // Filtre anti-absurde (anciennes sessions sauvegardées avant le filtre GPS).
  if (secParKm < 120 || secParKm > 1800) return '--';
  const minutes = Math.floor(secParKm / 60);
  const secondes = Math.round(secParKm % 60);
  return `${minutes}:${String(secondes).padStart(2, '0')} /km`;
}

type RouteParams = {id: string};

export const EcranDetailEntrainement = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {id} = (route.params ?? {}) as RouteParams;

  const [entrainement, setEntrainement] = useState<EntrainementSauvegarde | null>(null);

  useFocusEffect(
    useCallback(() => {
      chargerEntrainements().then(liste => {
        setEntrainement(liste.find(e => e.id === id) ?? null);
      });
    }, [id]),
  );

  const derive = useMemo(() => {
    if (!entrainement) {
      return null;
    }

    const minutes = entrainement.dureeSecondes / 60;
    const cadence =
      minutes > 0 ? Math.round(entrainement.nombrePas / minutes) : null;
    const longueurPas =
      entrainement.nombrePas > 0
        ? entrainement.distanceMetres / entrainement.nombrePas
        : null;

    const longueurPasOk =
      longueurPas !== null && longueurPas > 0 && longueurPas <= 2.5
        ? longueurPas
        : null;

    return {cadence, longueurPas: longueurPasOk};
  }, [entrainement]);

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.barreHaut}>
          <TouchableOpacity
            style={styles.boutonRetour}
            onPress={() => navigation.goBack()}>
            <Text style={styles.texteRetour}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Détails</Text>
        </View>

        {!entrainement ? (
          <View style={styles.vide}>
            <Text style={styles.videTexte}>Entraînement introuvable.</Text>
            <Text style={styles.videInstructions}>
              Retourne à l'historique et réessaie.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.contenuScroll}>
            <View style={styles.entete}>
              <Text style={styles.nom} numberOfLines={2}>
                {entrainement.nom}
              </Text>
              <Text style={styles.date}>
                {formaterDateLongue(entrainement.dateISO)}
              </Text>
            </View>

            <View style={styles.carteHero}>
              <View style={styles.heroLigne}>
                <View style={styles.heroBloc}>
                  <Text style={styles.heroValeur}>
                    {formaterDuree(entrainement.dureeSecondes)}
                  </Text>
                  <Text style={styles.heroLibelle}>Durée</Text>
                </View>
                <View style={styles.heroSeparateur} />
                <View style={styles.heroBloc}>
                  <Text style={styles.heroValeur}>
                    {entrainement.distanceMetres >= 1000
                      ? `${(entrainement.distanceMetres / 1000).toFixed(2)} km`
                      : `${Math.round(entrainement.distanceMetres)} m`}
                  </Text>
                  <Text style={styles.heroLibelle}>Distance</Text>
                </View>
              </View>

              <View style={styles.heroSousLigne}>
                <View style={styles.puce}>
                  <Text style={styles.puceValeur}>{entrainement.nombrePas}</Text>
                  <Text style={styles.puceLibelle}>Pas</Text>
                </View>
                <View style={styles.puce}>
                  <Text style={styles.puceValeur}>
                    {entrainement.vitesseMoyenneKmh.toFixed(1)}
                  </Text>
                  <Text style={styles.puceLibelle}>km/h moy.</Text>
                </View>
                <View style={styles.puce}>
                  <Text style={styles.puceValeur}>
                    {formaterAllure(
                      entrainement.distanceMetres,
                      entrainement.dureeSecondes,
                    )}
                  </Text>
                  <Text style={styles.puceLibelle}>Allure</Text>
                </View>
              </View>
            </View>

            <Text style={styles.titreSection}>Analyse</Text>
            <View style={styles.grille}>
              <View style={styles.carte}>
                <Text style={styles.carteTitre}>Cadence</Text>
                <Text style={styles.carteValeur}>
                  {derive?.cadence ?? '--'}
                  {derive?.cadence ? ' pas/min' : ''}
                </Text>
              </View>
              <View style={styles.carte}>
                <Text style={styles.carteTitre}>Longueur pas</Text>
                <Text style={styles.carteValeur}>
                  {derive?.longueurPas != null
                    ? `${derive.longueurPas.toFixed(2)} m`
                    : '--'}
                </Text>
              </View>
              <View style={styles.carte}>
                <Text style={styles.carteTitre}>Vitesse moy.</Text>
                <Text style={styles.carteValeur}>
                  {entrainement.vitesseMoyenneKmh.toFixed(1)} km/h
                </Text>
              </View>
              <View style={styles.carte}>
                <Text style={styles.carteTitre}>Temps total</Text>
                <Text style={styles.carteValeur}>
                  {formaterDuree(entrainement.dureeSecondes)}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
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
    borderColor: 'rgba(253,226,255,0.25)',
    backgroundColor: 'rgba(253,226,255,0.08)',
  },
  texteRetour: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 16,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 26,
    color: theme.couleurs.texte,
  },
  scroll: {flex: 1},
  contenuScroll: {
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.md,
    paddingBottom: theme.espacement.xl,
  },
  entete: {
    marginBottom: theme.espacement.md,
  },
  nom: {
    fontFamily: theme.polices.grasse,
    fontSize: 26,
    color: theme.couleurs.texte,
    marginBottom: 6,
  },
  date: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
  },
  carteHero: {
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253,226,255,0.25)',
    borderRadius: theme.rayonBordure.lg,
    padding: theme.espacement.lg,
    marginBottom: theme.espacement.lg,
  },
  heroLigne: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBloc: {
    flex: 1,
    alignItems: 'center',
  },
  heroSeparateur: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(253,226,255,0.18)',
  },
  heroValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 26,
    color: theme.couleurs.texte,
    textAlign: 'center',
  },
  heroLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    marginTop: 4,
  },
  heroSousLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.espacement.sm,
    marginTop: theme.espacement.lg,
  },
  puce: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(253,226,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(253,226,255,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  puceValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 16,
    color: theme.couleurs.primaire,
    textAlign: 'center',
  },
  puceLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 11,
    color: theme.couleurs.texteSecondaire,
    marginTop: 3,
    textAlign: 'center',
  },
  titreSection: {
    fontFamily: theme.polices.grasse,
    fontSize: 18,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.md,
  },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.md,
  },
  carte: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253,226,255,0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    alignItems: 'flex-start',
  },
  carteTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
  },
  carteValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 18,
    color: theme.couleurs.texte,
    marginTop: 6,
  },
  vide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.xl,
  },
  videTexte: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.texte,
    textAlign: 'center',
    marginBottom: theme.espacement.sm,
  },
  videInstructions: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
  },
});
