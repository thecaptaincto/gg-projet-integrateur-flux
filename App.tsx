import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {FournisseurAuth} from './src/contextes/ContexteAuth';
import {BorneErreur} from './src/composants/BorneErreur';
import {NavigateurApp} from './src/navigation/NavigateurApp';

// Point d'entrée de l'application.
// L'arbre de composants suit une hiérarchie précise :
//   SafeAreaProvider  → fournit les dimensions des zones sécurisées (encoches, barre de statut)
//     FournisseurAuth → expose le contexte d'authentification Firebase à toute l'appli
//       NavigateurApp → gère le routage selon l'état de connexion de l'utilisateur
export default function App() {
  useEffect(() => {
    if (!__DEV__) return;
    // Jest sets this env var; avoid long-running intervals that make tests hang.
    if (process.env.JEST_WORKER_ID) return;
    console.log('[Flux] App mounted');
    const id = setInterval(() => {
      console.log('[Flux] heartbeat', Date.now());
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.racine}>
      {__DEV__ ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Text style={styles.overlayTexte}>Flux • BOOT OK</Text>
        </View>
      ) : null}
      <SafeAreaProvider>
        <FournisseurAuth>
          <BorneErreur>
            <NavigateurApp />
          </BorneErreur>
        </FournisseurAuth>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  // Si tu vois encore un écran blanc après ce changement, c'est que l'UI RN n'est
  // pas en train d'être affichée (ou qu'une vue native la recouvre).
  racine: {flex: 1, backgroundColor: '#101018'},
  overlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayTexte: {color: '#ffffff', fontSize: 12},
});
