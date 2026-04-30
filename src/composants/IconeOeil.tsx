import React from 'react';
import {StyleSheet, View} from 'react-native';

import {theme} from '../styles/theme';

interface ProprietesIconeOeil {
  visible: boolean;
}

export const IconeOeil: React.FC<ProprietesIconeOeil> = ({visible}) => {
  return (
    <View style={styles.conteneur}>
      <View style={styles.oeil}>
        <View style={styles.iris} />
      </View>
      {!visible ? <View style={styles.barreMasquee} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  oeil: {
    width: 20,
    height: 12,
    borderWidth: 1.8,
    borderColor: theme.couleurs.texteClair,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iris: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.couleurs.texteClair,
  },
  barreMasquee: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: theme.couleurs.texteClair,
    transform: [{rotate: '-35deg'}],
    borderRadius: 999,
  },
});
