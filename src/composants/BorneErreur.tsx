import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {
  children: React.ReactNode;
};

type State = {
  erreur?: Error;
};

export class BorneErreur extends React.PureComponent<Props, State> {
  state: State = {};

  static getDerivedStateFromError(erreur: Error): State {
    return {erreur};
  }

  componentDidCatch(erreur: Error, info: React.ErrorInfo) {
    console.error("Erreur de rendu (BorneErreur):", erreur, info?.componentStack);
  }

  render() {
    if (this.state.erreur) {
      return (
        <View style={styles.conteneur}>
          <Text style={styles.titre}>Une erreur est survenue</Text>
          <Text style={styles.message}>{this.state.erreur.message}</Text>
          <Text style={styles.aide}>
            Ouvre `npx react-native log-android` et copie les lignes `ReactNativeJS`
            juste au-dessus de cette erreur.
          </Text>
        </View>
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
    backgroundColor: '#101018',
  },
  titre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#b00020',
    marginBottom: 12,
    textAlign: 'center',
  },
  aide: {
    fontSize: 12,
    color: '#dddddd',
    textAlign: 'center',
  },
});
