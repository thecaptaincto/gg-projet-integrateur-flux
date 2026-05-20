// IconeOeil.tsx — Icône visibilité pour les champs mot de passe.
// Dessine un œil stylisé avec CSS uniquement (pas d'image ou de librairie d'icônes)
// pour éviter les dépendances supplémentaires. Quand `visible` est faux, une barre
// diagonale se superpose à l'œil pour indiquer que le texte est masqué.

import React from 'react';
import {StyleSheet, View} from 'react-native';

import {theme} from '../styles/theme';

interface ProprietesIconeOeil {
  visible: boolean; // `true` affiche le mot de passe sans barre de masquage
}

export const IconeOeil: React.FC<ProprietesIconeOeil> = ({visible}) => {
  return (
    <View style={styles.conteneur}>
      {/* Forme ovale représentant le contour de l'œil */}
      <View style={styles.oeil}>
        {/* Cercle central représentant l'iris/pupille */}
        <View style={styles.iris} />
      </View>
      {/* Barre diagonale affichée uniquement quand le texte est masqué */}
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
