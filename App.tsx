import React from 'react';
import {FournisseurAuth} from './src/contextes/ContexteAuth';
import {NavigateurApp} from './src/navigation/NavigateurApp';

export default function App() {
  return (
    <FournisseurAuth>
      <NavigateurApp />
    </FournisseurAuth>
  );
}