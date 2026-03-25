import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {FournisseurAuth} from './src/contextes/ContexteAuth';
import {NavigateurApp} from './src/navigation/NavigateurApp';

// Point d'entrée de l'application.
// L'arbre de composants suit une hiérarchie précise :
//   SafeAreaProvider  → fournit les dimensions des zones sécurisées (encoches, barre de statut)
//     FournisseurAuth → expose le contexte d'authentification Firebase à toute l'appli
//       NavigateurApp → gère le routage selon l'état de connexion de l'utilisateur
export default function App() {
  return (
    <SafeAreaProvider>
      <FournisseurAuth>
        <NavigateurApp />
      </FournisseurAuth>
    </SafeAreaProvider>
  );
}
