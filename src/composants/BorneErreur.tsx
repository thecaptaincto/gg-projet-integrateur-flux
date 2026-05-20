// BorneErreur.tsx — Composant de type "Error Boundary" (React class component).
// Intercepte toute exception levée pendant le rendu d'un enfant et affiche
// un écran de secours plutôt que de laisser l'application planter silencieusement.
// Les Error Boundaries doivent obligatoirement être des composants de classe (React API).

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ArrierePlanGradient} from './ArrierePlanGradient';
import {theme} from '../styles/theme';

type ProprietesBorneErreur = {
  children: React.ReactNode;
};

type EtatBorneErreur = {
  erreur?: Error;
};

export class BorneErreur extends React.PureComponent<
  ProprietesBorneErreur,
  EtatBorneErreur
> {
  state: EtatBorneErreur = {};

  // getDerivedStateFromError est appelé lors d'une exception de rendu ;
  // on mémorise l'erreur pour basculer vers l'écran de secours
  static getDerivedStateFromError(erreur: Error): EtatBorneErreur {
    return {erreur};
  }

  // componentDidCatch est appelé après getDerivedStateFromError ;
  // on logue ici pour faciliter le débogage (stack trace visible dans Metro)
  componentDidCatch(erreur: Error, info: React.ErrorInfo) {
    console.error("Erreur de rendu (BorneErreur):", erreur, info?.componentStack);
  }

  render() {
    if (this.state.erreur) {
      return (
        <ArrierePlanGradient>
          <View style={styles.conteneur}>
            <View style={styles.carte}>
              <Text style={styles.titre}>Une erreur est survenue</Text>
              <Text style={styles.message}>{this.state.erreur.message}</Text>
              <Text style={styles.aide}>
                Ouvre `npx react-native log-android` et copie les lignes `ReactNativeJS`
                juste au-dessus de cette erreur.
              </Text>
            </View>
          </View>
        </ArrierePlanGradient>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  carte: {
    backgroundColor: theme.couleurs.surfaceForte,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureMoyenne,
    borderRadius: theme.rayonBordure.lg,
    padding: theme.espacement.lg,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 24,
    color: theme.couleurs.texte,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.alerteErreurBordure,
    marginBottom: 12,
    textAlign: 'center',
  },
  aide: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
  },
});
