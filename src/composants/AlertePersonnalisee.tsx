import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../styles/theme';

export type TypeAlertePersonnalisee = 'confirmation' | 'avertissement' | 'info';

interface PropsAlertePersonnalisee {
  visible: boolean;
  type: TypeAlertePersonnalisee;
  titre: string;
  message: string;
  onConfirmer?: () => void;
  onAnnuler?: () => void;
  texteConfirmer?: string;
  texteAnnuler?: string;
}

export const AlertePersonnalisee: React.FC<PropsAlertePersonnalisee> = ({
  visible,
  type,
  titre,
  message,
  onConfirmer,
  onAnnuler,
  texteConfirmer,
  texteAnnuler,
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim, visible]);

  const config = React.useMemo(() => {
    switch (type) {
      case 'confirmation':
        return {
          couleursGradient: [
            theme.couleurs.alerteConfirmationDebut,
            theme.couleurs.alerteConfirmationFin,
          ],
          couleurBordure: theme.couleurs.alerteConfirmationBordure,
          icone: '✓',
          couleurAction: theme.couleurs.violetAccent,
        };
      case 'avertissement':
        return {
          couleursGradient: [
            theme.couleurs.alerteAvertissementDebut,
            theme.couleurs.alerteAvertissementFin,
          ],
          couleurBordure: theme.couleurs.alerteAvertissementBordure,
          icone: '⚠',
          couleurAction: theme.couleurs.alerteAvertissementBordure,
        };
      case 'info':
      default:
        return {
          couleursGradient: [
            theme.couleurs.alerteInfoDebut,
            theme.couleurs.alerteInfoFin,
          ],
          couleurBordure: theme.couleurs.alerteInfoBordure,
          icone: 'ℹ',
          couleurAction: theme.couleurs.violetAccent,
        };
    }
  }, [type]);

  const gererFermer = React.useCallback(() => {
    if (type === 'confirmation') {
      onAnnuler?.();
      return;
    }

    // Pour info/avertissement, un tap en dehors revient à "OK" si fourni.
    onConfirmer?.();
  }, [onAnnuler, onConfirmer, type]);

  const libelleConfirmer =
    texteConfirmer ?? (type === 'confirmation' ? 'Confirmer' : 'OK');
  const libelleAnnuler = texteAnnuler ?? 'Annuler';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={gererFermer}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={gererFermer}>
          <View style={styles.conteneurAlerte}>
            <View
              style={[styles.carteBordure, {borderColor: config.couleurBordure}]}>
              <LinearGradient
                colors={config.couleursGradient}
                style={styles.carteInterieur}>
                <View style={styles.entete}>
                  <Text style={[styles.icone, {color: config.couleurAction}]}>
                    {config.icone}
                  </Text>
                  <Text style={styles.titre}>{titre}</Text>
                </View>

                <Text style={styles.message}>{message}</Text>

                <View style={styles.conteneurBoutons}>
                  {type === 'confirmation' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.bouton, styles.boutonSecondaire]}
                        onPress={onAnnuler}>
                        <Text style={styles.texteBoutonSecondaire}>
                          {libelleAnnuler}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.bouton,
                          styles.boutonPrimaire,
                          {backgroundColor: config.couleurAction},
                        ]}
                        onPress={onConfirmer}>
                        <Text style={styles.texteBoutonPrimaire}>
                          {libelleConfirmer}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.bouton,
                        styles.boutonPrimaire,
                        {backgroundColor: config.couleurAction},
                      ]}
                      onPress={onConfirmer}>
                      <Text style={styles.texteBoutonPrimaire}>
                        {libelleConfirmer}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.couleurs.overlayModal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteneurAlerte: {
    width: '85%',
    maxWidth: 400,
  },
  carteBordure: {
    borderRadius: 20,
    borderWidth: 2,
  },
  carteInterieur: {
    borderRadius: 18,
    padding: 24,
  },
  entete: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icone: {
    fontFamily: theme.polices.reguliere,
    fontSize: 28,
    marginBottom: 6,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texteClair,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteSecondaire,
    marginBottom: theme.espacement.lg,
    textAlign: 'center',
    lineHeight: 24,
  },
  conteneurBoutons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bouton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  boutonPrimaire: {
    backgroundColor: theme.couleurs.violetAccent,
  },
  boutonSecondaire: {
    backgroundColor: 'rgba(253, 226, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.5)',
  },
  texteBoutonPrimaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  texteBoutonSecondaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteClair,
  },
});
