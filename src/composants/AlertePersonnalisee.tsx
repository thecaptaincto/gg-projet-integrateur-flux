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

export type TypeAlerteSeverite = 'info' | 'attention' | 'avertissement' | 'erreur';
export type TypeAlertePersonnalisee = 'confirmation' | TypeAlerteSeverite;

// Remplacement de l'Alert natif de React Native par une modale stylisée.
// Supporte plusieurs types sémantiques qui changent automatiquement les couleurs et l'icône :
//   - 'confirmation'  : deux boutons (Annuler / Confirmer) pour les actions irréversibles
//   - 'attention'     : validation / champs manquants
//   - 'avertissement' : avertissement non bloquant
//   - 'erreur'        : échec / erreur serveur
//   - 'info'          : message neutre
interface ProprietesAlertePersonnalisee {
  visible: boolean;
  type: TypeAlertePersonnalisee;
  titre: string;
  message: string;
  onConfirmer?: () => void;
  onAnnuler?: () => void;
  texteConfirmer?: string;
  texteAnnuler?: string;
}

export const AlertePersonnalisee: React.FC<ProprietesAlertePersonnalisee> = ({
  visible,
  type,
  titre,
  message,
  onConfirmer,
  onAnnuler,
  texteConfirmer,
  texteAnnuler,
}) => {
  const [animationFondu] = React.useState(new Animated.Value(0));

  // Animation de fondu à l'entrée et à la sortie pour éviter un affichage brutal
  React.useEffect(() => {
    if (visible) {
      Animated.timing(animationFondu, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animationFondu, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [animationFondu, visible]);

  // Calcul mémoïsé de la configuration visuelle selon le type d'alerte.
  // useMemo évite de recalculer cet objet à chaque rendu tant que `type` ne change pas.
  const configurationVisuelle = React.useMemo(() => {
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
      case 'attention':
        return {
          couleursGradient: [
            theme.couleurs.alerteAttentionDebut,
            theme.couleurs.alerteAttentionFin,
          ],
          couleurBordure: theme.couleurs.alerteAttentionBordure,
          icone: '!',
          couleurAction: theme.couleurs.alerteAttentionBordure,
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
      case 'erreur':
        return {
          couleursGradient: [
            theme.couleurs.alerteErreurDebut,
            theme.couleurs.alerteErreurFin,
          ],
          couleurBordure: theme.couleurs.alerteErreurBordure,
          icone: '✖',
          couleurAction: theme.couleurs.alerteErreurBordure,
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

  // Comportement du tap en dehors de la carte :
  // pour une confirmation, on annule (action sûre par défaut)
  // pour info/avertissement, on confirme (équivalent à appuyer sur OK)
  const gererFermer = React.useCallback(() => {
    if (type === 'confirmation') {
      onAnnuler?.();
      return;
    }

    // Pour info/attention/avertissement/erreur, un tap en dehors revient à "OK" si fourni.
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
      <Animated.View style={[styles.surcouche, {opacity: animationFondu}]}>
        <TouchableOpacity
          style={styles.surcoucheTouchable}
          activeOpacity={1}
          onPress={gererFermer}>
          <View style={styles.conteneurAlerte}>
            <View
              style={[
                styles.carteBordure,
                {borderColor: configurationVisuelle.couleurBordure},
              ]}>
              <LinearGradient
                colors={configurationVisuelle.couleursGradient}
                style={styles.carteInterieur}>
                <View style={styles.entete}>
                  <Text
                    style={[
                      styles.icone,
                      {color: configurationVisuelle.couleurAction},
                    ]}>
                    {configurationVisuelle.icone}
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
                          {
                            backgroundColor:
                              configurationVisuelle.couleurAction,
                          },
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
                        {
                          backgroundColor: configurationVisuelle.couleurAction,
                        },
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
  surcouche: {
    flex: 1,
    backgroundColor: theme.couleurs.overlayModal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surcoucheTouchable: {
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
