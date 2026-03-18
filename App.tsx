import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {FournisseurAuth} from './src/contextes/ContexteAuth';
import {NavigateurApp} from './src/navigation/NavigateurApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <FournisseurAuth>
        <NavigateurApp />
      </FournisseurAuth>
    </SafeAreaProvider>
  );
}
