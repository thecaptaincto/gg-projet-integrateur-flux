import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../styles/theme';

interface PropsArrierePlanGradient {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ArrierePlanGradient: React.FC<PropsArrierePlanGradient> = ({
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