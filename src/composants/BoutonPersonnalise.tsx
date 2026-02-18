import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {theme} from '../styles/theme';

interface PropsBoutonPersonnalise {
  titre: string;
  auClic: () => void;
  variante?: 'primaire' | 'secondaire';
  style?: ViewStyle;
}

export const BoutonPersonnalise: React.FC<PropsBoutonPersonnalise> = ({
  titre,
  auClic,
  variante = 'primaire',
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.bouton,
        variante === 'primaire' ? styles.boutonPrimaire : styles.boutonSecondaire,
        style,
      ]}
      onPress={auClic}>
      <Text
        style={
          variante === 'primaire'
            ? styles.texteBoutonPrimaire
            : styles.texteBoutonSecondaire
        }>
        {titre}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bouton: {
    paddingVertical: theme.espacement.md,
    borderRadius: theme.rayonBordure.md,
    alignItems: 'center',
  },
  boutonPrimaire: {
    backgroundColor: theme.couleurs.boutonPrimaire,
  },
  texteBoutonPrimaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  boutonSecondaire: {
    borderWidth: 2,
    borderColor: theme.couleurs.bordure,
  },
  texteBoutonSecondaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteClair,
  },
});