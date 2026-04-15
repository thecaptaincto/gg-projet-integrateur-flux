/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-firebase/auth', () => {
  const auth = () => ({
    currentUser: {email: 'test@example.com'},
    onAuthStateChanged: (callback: (user: any) => void) => {
      callback(null);
      return () => {};
    },
    createUserWithEmailAndPassword: jest.fn(async () => ({
      user: {
        sendEmailVerification: jest.fn(async () => {}),
        updateProfile: jest.fn(async () => {}),
      },
    })),
    signInWithEmailAndPassword: jest.fn(async () => ({})),
    sendPasswordResetEmail: jest.fn(async () => {}),
    signOut: jest.fn(async () => {}),
  });

  return auth;
});

jest.mock('../src/navigation/NavigateurApp', () => ({
  NavigateurApp: () => null,
}));

test("s'affiche correctement", async () => {
  const App = require('../App').default;
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
