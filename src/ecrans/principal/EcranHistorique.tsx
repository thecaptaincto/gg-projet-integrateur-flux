import React, {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {
  chargerEntrainements,
  supprimerEntrainement,
  type EntrainementSauvegarde,
} from '../../utils/stockageEntrainements';
import {AlertePersonnalisee} from '../../composants/AlertePersonnalisee';

function formaterDuree(totalSecondes: number): string {
  const h = Math.floor(totalSecondes / 3600);
  const m = Math.floor((totalSecondes % 3600) / 60);
  const s = totalSecondes % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formaterDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-CA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type PeriodeFiltre = 'tout' | 'jour' | 'semaine' | 'mois';

function estDansPeriode(dateISO: string, periode: Exclude<PeriodeFiltre, 'tout'>): boolean {
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

  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  return date >= debutMois;
}

export const EcranHistorique = () => {
  const {utilisateur} = utiliserAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [entrainements, setEntrainements] = useState<EntrainementSauvegarde[]>([]);
  const [idASupprimer, setIdASupprimer] = useState<string | null>(null);
  const periodeDepuisRoute = route.params?.periode as
    | Exclude<PeriodeFiltre, 'tout'>
    | undefined;
  const [periode, setPeriode] = useState<PeriodeFiltre>(
    periodeDepuisRoute ?? 'tout',
  );

  React.useEffect(() => {
    setPeriode(periodeDepuisRoute ?? 'tout');
  }, [periodeDepuisRoute]);

  useFocusEffect(
    useCallback(() => {
      chargerEntrainements(utilisateur?.uid).then(setEntrainements);
    }, [utilisateur?.uid]),
  );

  const entrainementsAffiches = useMemo(() => {
    if (periode === 'tout') {
      return entrainements;
    }
    return entrainements.filter(e => estDansPeriode(e.dateISO, periode));
  }, [entrainements, periode]);

  const confirmerSuppression = async () => {
    if (!idASupprimer) {
      return;
    }
    await supprimerEntrainement(utilisateur?.uid, idASupprimer);
    setEntrainements(prev => prev.filter(e => e.id !== idASupprimer));
    setIdASupprimer(null);
  };

  const ouvrirDetails = (id: string) => {
    navigation.navigate('DetailEntrainement', {id});
  };

  const rendreElement = ({item}: {item: EntrainementSauvegarde}) => (
    <View style={styles.carte}>
      <View style={styles.carteEntete}>
        <Text style={styles.carteNom} numberOfLines={1}>
          {item.nom}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.boutonDetails}
            onPress={() => ouvrirDetails(item.id)}>
            <Text style={styles.boutonDetailsTexte}>Détails</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonSupprimer}
            onPress={() => setIdASupprimer(item.id)}>
            <Text style={styles.boutonSupprimerTexte}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.carteDate}>{formaterDate(item.dateISO)}</Text>
      <View style={styles.carteStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValeur}>{formaterDuree(item.dureeSecondes)}</Text>
          <Text style={styles.statLibelle}>Durée</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.statItem}>
          <Text style={styles.statValeur}>
            {item.distanceMetres >= 1000
              ? `${(item.distanceMetres / 1000).toFixed(2)} km`
              : `${Math.round(item.distanceMetres)} m`}
          </Text>
          <Text style={styles.statLibelle}>Distance</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.statItem}>
          <Text style={styles.statValeur}>{item.nombrePas}</Text>
          <Text style={styles.statLibelle}>Pas</Text>
        </View>
        <View style={styles.separateur} />
        <View style={styles.statItem}>
          <Text style={styles.statValeur}>
            {item.vitesseMoyenneKmh.toFixed(1)}
          </Text>
          <Text style={styles.statLibelle}>km/h moy.</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.barreHaut}>
          <TouchableOpacity
            style={styles.boutonRetour}
            onPress={() => navigation.goBack()}>
            <Text style={styles.texteRetour}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Historique</Text>
        </View>

        <View style={styles.filtres}>
          {(
            [
              {key: 'tout', label: 'Tout'},
              {key: 'jour', label: "Aujourd'hui"},
              {key: 'semaine', label: 'Semaine'},
              {key: 'mois', label: 'Mois'},
            ] as const
          ).map(item => {
            const actif = periode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filtrePuce, actif && styles.filtrePuceActif]}
                onPress={() => setPeriode(item.key)}>
                <Text style={[styles.filtreTexte, actif && styles.filtreTexteActif]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {entrainementsAffiches.length === 0 ? (
          <View style={styles.vide}>
            <Text style={styles.videTexte}>
              {periode === 'tout'
                ? 'Aucun entraînement sauvegardé.'
                : 'Aucun entraînement pour cette période.'}
            </Text>
            <Text style={styles.videInstructions}>
              Lance un suivi depuis l'onglet Enregistrer.
            </Text>
          </View>
        ) : (
          <FlatList
            data={entrainementsAffiches}
            keyExtractor={item => item.id}
            renderItem={rendreElement}
            contentContainerStyle={styles.liste}
          />
        )}

        <AlertePersonnalisee
          visible={idASupprimer !== null}
          type="confirmation"
          titre="Supprimer l'entraînement"
          message="Cette action est irréversible."
          texteConfirmer="Supprimer"
          texteAnnuler="Annuler"
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setIdASupprimer(null)}
        />
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
  filtres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.sm,
    paddingHorizontal: theme.espacement.lg,
    paddingBottom: theme.espacement.md,
  },
  filtrePuce: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(253,226,255,0.25)',
    backgroundColor: 'rgba(253,226,255,0.06)',
  },
  filtrePuceActif: {
    backgroundColor: theme.couleurs.violetAccent,
    borderColor: 'rgba(253,226,255,0.15)',
  },
  filtreTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 12,
  },
  filtreTexteActif: {
    color: theme.couleurs.texte,
  },
  liste: {
    paddingHorizontal: theme.espacement.lg,
    paddingBottom: theme.espacement.xl,
  },
  carte: {
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253,226,255,0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    marginBottom: theme.espacement.md,
  },
  carteEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  carteNom: {
    fontFamily: theme.polices.grasse,
    fontSize: 20,
    color: theme.couleurs.texte,
    flex: 1,
    marginRight: theme.espacement.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espacement.sm,
  },
  boutonDetails: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,226,255,0.25)',
    backgroundColor: 'rgba(253,226,255,0.08)',
  },
  boutonDetailsTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 12,
  },
  boutonSupprimer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonSupprimerTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.erreur,
    fontSize: 14,
  },
  carteDate: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    marginBottom: theme.espacement.sm,
  },
  carteStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 16,
    color: theme.couleurs.primaire,
  },
  statLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 11,
    color: theme.couleurs.texteSecondaire,
    marginTop: 2,
  },
  separateur: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(253,226,255,0.2)',
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
