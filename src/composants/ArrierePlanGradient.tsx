import React from 'react';
import {StyleSheet, type ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../styles/theme';

interface ProprietesArrierePlanGradient {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Composant enveloppeur qui applique le dégradé violet signature de l'application.
// Utilisé comme conteneur de base sur tous les écrans pour assurer une
// identité visuelle uniforme sans dupliquer la configuration du dégradé.
export const ArrierePlanGradient: React.FC<ProprietesArrierePlanGradient> = ({
  children,
  style,
}) => {
  return (
    <LinearGradient
      colors={[
        theme.couleurs.debutGradient,
        theme.couleurs.milieuGradient,
        theme.couleurs.finGradient,
      ]}
      style={[styles.gradient, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
