// App.tsx — Composant racine de l'application Flux.
// Il empile les fournisseurs de contexte dans l'ordre requis :
//   1. GestureHandlerRootView  — active les gestes (swipe, drag) sur tout l'arbre
//   2. SafeAreaProvider        — fournit les insets (encoche, barre de navigation)
//   3. FournisseurAuth         — gère la session Firebase (connexion, inscription, code d'accès)
//   4. FournisseurNotifications — gère les jetons FCM et la boîte de notifications
//   5. BorneErreur             — capture les erreurs de rendu React et affiche un écran de secours
//   6. NavigateurApp           — pilote la navigation conditionnelle selon l'état d'auth

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {FournisseurAuth} from './src/contextes/ContexteAuth';
import {FournisseurNotifications} from './src/contextes/ContexteNotifications';
import {BorneErreur} from './src/composants/BorneErreur';
import {NavigateurApp} from './src/navigation/NavigateurApp';

export default function App() {
  return (
    // GestureHandlerRootView doit envelopper toute l'application pour que les
    // gestes fonctionnent correctement (obligation de react-native-gesture-handler)
    <GestureHandlerRootView style={styles.racine}>
      <SafeAreaProvider>
        <FournisseurAuth>
          <FournisseurNotifications>
            {/* BorneErreur attrape les erreurs de rendu non gérées et empêche
                l'application de planter silencieusement */}
            <BorneErreur>
              <NavigateurApp />
            </BorneErreur>
          </FournisseurNotifications>
        </FournisseurAuth>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Couleur de fond identique au début du dégradé pour éviter un flash blanc au démarrage
  racine: {flex: 1, backgroundColor: '#14001d'},
});
