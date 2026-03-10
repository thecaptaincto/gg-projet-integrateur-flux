import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {ArrierePlanGradient} from './ArrierePlanGradient';

interface PropsAlertePersonnalisee {
  visible: boolean;
  titre: string;
  message: string;
  boutons?: {
    texte: string;
    onPress: () => void;
    style?: 'primaire' | 'secondaire' | 'danger';
  }[];
  onFermer?: () => void;
}

export const AlertePersonnalisee: React.FC<PropsAlertePersonnalisee> = ({
  visible,
  titre,
  message,
  boutons = [{texte: 'OK', onPress: () => {}}],
  onFermer,
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
  }, [visible]);

  const obtenirStyleBouton = (style?: string) => {
    switch (style) {
      case 'primaire':
        return styles.boutonPrimaire;
      case 'danger':
        return styles.boutonDanger;
      case 'secondaire':
      default:
        return styles.boutonSecondaire;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onFermer}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onFermer}>
          <View style={styles.conteneurAlerte}>
            <View style={styles.carteBordure}>
              <View style={styles.carteInterieur}>
                <Text style={styles.titre}>{titre}</Text>
                <Text style={styles.message}>{message}</Text>

                <View style={styles.conteneurBoutons}>
                  {boutons.map((bouton, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.bouton, obtenirStyleBouton(bouton.style)]}
                      onPress={() => {
                        bouton.onPress();
                        onFermer?.();
                      }}>
                      <Text style={styles.texteBouton}>{bouton.texte}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    padding: 2,
    backgroundColor: 'rgba(253, 226, 255, 0.3)',
  },
  carteInterieur: {
    backgroundColor: '#2a0038',
    borderRadius: 18,
    padding: 24,
  },
  titre: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 24,
    color: '#FDE2FF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 16,
    color: 'rgba(253, 226, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  conteneurBoutons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    backgroundColor: '#a855f7',
  },
  boutonSecondaire: {
    backgroundColor: 'rgba(253, 226, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.5)',
  },
  boutonDanger: {
    backgroundColor: '#ef4444',
  },
  texteBouton: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 16,
    color: '#FDE2FF',
  },
});