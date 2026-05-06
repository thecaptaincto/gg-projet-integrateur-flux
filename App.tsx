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
    <GestureHandlerRootView style={styles.racine}>
      <SafeAreaProvider>
        <FournisseurAuth>
          <FournisseurNotifications>
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
  racine: {flex: 1, backgroundColor: '#14001d'},
});
