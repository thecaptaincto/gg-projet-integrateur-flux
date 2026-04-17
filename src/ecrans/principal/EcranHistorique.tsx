import React, {useCallback, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';
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

export const EcranHistorique = () => {
  const navigation = useNavigation<any>();
  const [entrainements, setEntrainements] = useState<EntrainementSauvegarde[]>([]);
  const [idASupprimer, setIdASupprimer] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      chargerEntrainements().then(setEntrainements);
    }, []),
  );

  const handleSupprimer = async () => {
    if (!idASupprimer) {
      return;
    }
    await supprimerEntrainement(idASupprimer);
    setEntrainements(prev => prev.filter(e => e.id !== idASupprimer));
    setIdASupprimer(null);
  };

  const renderItem = ({item}: {item: EntrainementSauvegarde}) => (
    <View style={styles.carte}>
      <View style={styles.carteEntete}>
        <Text style={styles.carteNom} numberOfLines={1}>
          {item.nom}
        </Text>
        <TouchableOpacity
          style={styles.boutonSupprimer}
          onPress={() => setIdASupprimer(item.id)}>
          <Text style={styles.boutonSupprimerTexte}>✕</Text>
        </TouchableOpacity>
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

        {entrainements.length === 0 ? (
          <View style={styles.vide}>
            <Text style={styles.videTexte}>Aucun entraînement sauvegardé.</Text>
            <Text style={styles.videInstructions}>
              Lance un suivi depuis l'onglet Enregistrer.
            </Text>
          </View>
        ) : (
          <FlatList
            data={entrainements}
            keyExtractor={item => item.id}
            renderItem={renderItem}
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
          onConfirmer={handleSupprimer}
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
