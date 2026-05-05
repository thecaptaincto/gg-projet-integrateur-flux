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

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    hasPermission: jest.fn(async () => 1),
    getToken: jest.fn(async () => 'token-test'),
    onMessage: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    onTokenRefresh: jest.fn(() => () => {}),
    getInitialNotification: jest.fn(async () => null),
    registerDeviceForRemoteMessages: jest.fn(async () => {}),
    requestPermission: jest.fn(async () => 1),
    setBackgroundMessageHandler: jest.fn(),
  });

  messaging.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  };

  return messaging;
});

jest.mock('@react-native-firebase/firestore', () => {
  const firestore = () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(async () => {}),
      })),
    })),
  });

  firestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'server-timestamp'),
    delete: jest.fn(() => 'field-delete'),
  };

  return firestore;
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      type: 'success',
      data: {idToken: 'google-token-test'},
    })),
    signOut: jest.fn(async () => null),
  },
  isErrorWithCode: jest.fn(() => false),
  isSuccessResponse: jest.fn((response: {type?: string}) => response?.type === 'success'),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    GOOGLE_WEB_CLIENT_ID: 'test-web-client-id',
    GOOGLE_IOS_CLIENT_ID: 'test-ios-client-id',
  },
}));

jest.mock('react-native-encrypted-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(async () => undefined),
    getItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native-linear-gradient', () => ({
  __esModule: true,
  default: ({children}: {children?: React.ReactNode}) => {
    const mockReact = require('react');
    return mockReact.createElement('View', null, children);
  },
}));

jest.mock('../src/navigation/NavigateurApp', () => ({
  NavigateurApp: () => null,
}));

test("s'affiche correctement", async () => {
  const App = require('../App').default;
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
