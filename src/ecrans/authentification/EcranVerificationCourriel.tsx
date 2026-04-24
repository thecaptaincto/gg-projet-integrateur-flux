import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {
  AlertePersonnalisee,
  type TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

export const EcranVerificationCourriel = () => {
  const {
    utilisateur,
    chargement,
    envoyerCourrielVerification,
    actualiserVerificationCourriel,
    seDeconnecter,
  } = utiliserAuth();
  const [alerte, setAlerte] = React.useState({
    visible: false,
    type: 'info' as TypeAlertePersonnalisee,
    titre: '',
    message: '',
  });

  const fermerAlerte = () => setAlerte(prev => ({...prev, visible: false}));

  const afficherAlerte = (
    type: TypeAlertePersonnalisee,
    titre: string,
    message: string,
  ) => {
    setAlerte({visible: true, type, titre, message});
  };

  const renvoyer = async () => {
    try {
      await envoyerCourrielVerification();
    } catch (e: any) {
      const type = e?.code === 'success' ? 'info' : 'erreur';
      afficherAlerte(
        type,
        e?.code === 'success' ? 'Courriel envoyé' : 'Erreur',
        e?.message ?? "Impossible d'envoyer le courriel.",
      );
    }
  };

  const confirmer = async () => {
    try {
      await actualiserVerificationCourriel();
    } catch (e: any) {
      afficherAlerte(
        'attention',
        'Pas encore vérifié',
        e?.message ?? "Le courriel n'est pas encore vérifié.",
      );
    }
  };

  const deconnexion = async () => {
    try {
      await seDeconnecter();
    } catch {
      // ignore
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.centre}>
          <Text style={styles.titre}>Vérifie ton courriel</Text>
          <Text style={styles.sousTitre}>
            Un lien de vérification a été envoyé à {utilisateur?.email ?? 'ton adresse courriel'}.
          </Text>
          <Text style={styles.sousTitreAide}>
            Ouvre ton courriel, clique sur le lien, puis reviens ici.
          </Text>

          <View style={styles.carte}>
            <Text style={styles.label}>Étapes</Text>
            <Text style={styles.etape}>1. Ouvre ton application courriel.</Text>
            <Text style={styles.etape}>2. Clique sur le lien de vérification Firebase.</Text>
            <Text style={styles.etape}>3. Reviens dans Flux et appuie sur J&apos;ai confirmé.</Text>

            <TouchableOpacity
              style={[styles.bouton, chargement && styles.boutonDesactive]}
              disabled={chargement}
              onPress={() => void confirmer()}>
              <Text style={styles.boutonTexte}>
                {chargement ? 'Vérification...' : "J'ai confirmé"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lien}
              disabled={chargement}
              onPress={() => void renvoyer()}>
              <Text style={styles.lienTexte}>Renvoyer le courriel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.lien} onPress={() => void deconnexion()}>
              <Text style={styles.lienTexte}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AlertePersonnalisee
          visible={alerte.visible}
          type={alerte.type}
          titre={alerte.titre}
          message={alerte.message}
          texteConfirmer="OK"
          onConfirmer={fermerAlerte}
          onAnnuler={fermerAlerte}
        />
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1},
  centre: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.lg,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 32,
    color: theme.couleurs.texte,
    textAlign: 'center',
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
    marginBottom: theme.espacement.sm,
  },
  sousTitreAide: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
    marginBottom: theme.espacement.xl,
    opacity: 0.9,
  },
  carte: {
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253,226,255,0.25)',
    borderRadius: theme.rayonBordure.lg,
    padding: theme.espacement.lg,
  },
  label: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginBottom: 10,
  },
  etape: {
    fontFamily: theme.polices.reguliere,
    fontSize: 15,
    color: theme.couleurs.texteClair,
    marginBottom: 8,
  },
  bouton: {
    marginTop: theme.espacement.lg,
    backgroundColor: theme.couleurs.violetAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  boutonDesactive: {
    opacity: 0.6,
  },
  boutonTexte: {
    fontFamily: theme.polices.grasse,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  lien: {
    marginTop: theme.espacement.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  lienTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteClair,
    textDecorationLine: 'underline',
  },
});
