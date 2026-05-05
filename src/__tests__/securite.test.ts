// ✅ Mocks pour Jest (tests en environnement Node, pas React Native)
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-config', () => ({
  default: {
    GOOGLE_WEB_CLIENT_ID: 'test-id',
    GOOGLE_IOS_CLIENT_ID: 'test-ios-id',
  },
}));

import { serviceRateLimiting } from '../services/serviceRateLimiting';

describe('🔐 Sécurité - Tests Critiques', () => {
  afterEach(() => {
    serviceRateLimiting.reinitialiserTous();
  });

  describe('Rate Limiting', () => {
    it('devrait autoriser 5 tentatives avant verrouillage', () => {
      const cle = 'test@test.com';

      for (let i = 0; i < 5; i++) {
        expect(serviceRateLimiting.verifier(cle)).toBe(true);
      }

      // 6ème tentative = verrouillée
      expect(serviceRateLimiting.verifier(cle)).toBe(false);
    });

    it('devrait avoir un délai exponentiel après dépassement', () => {
      const cle = 'test@test.com';

      // Faire 5 tentatives
      for (let i = 0; i < 5; i++) {
        serviceRateLimiting.verifier(cle);
      }

      // 6ème tentative échoue
      serviceRateLimiting.verifier(cle);

      // Délai d'attente doit être > 0
      const delai = serviceRateLimiting.obtenirDelaiAttente(cle);
      expect(delai).toBeGreaterThan(0);
    });

    it('devrait réinitialiser après succès', () => {
      const cle = 'test@test.com';

      expect(serviceRateLimiting.verifier(cle)).toBe(true);
      serviceRateLimiting.reinitialiser(cle);
      expect(serviceRateLimiting.obtenirDelaiAttente(cle)).toBe(0);
    });

    it('devrait supporter plusieurs clés indépendamment', () => {
      const cle1 = 'user1@test.com';
      const cle2 = 'user2@test.com';

      // User1: 5 tentatives
      for (let i = 0; i < 5; i++) {
        serviceRateLimiting.verifier(cle1);
      }

      // User2: devrait pouvoir essayer sans limite
      expect(serviceRateLimiting.verifier(cle2)).toBe(true);
      expect(serviceRateLimiting.verifier(cle2)).toBe(true);

      // User1: verrouillé
      expect(serviceRateLimiting.verifier(cle1)).toBe(false);
    });
  });

  describe('Validation des Formulaires', () => {
    it('devrait rejeter un mot de passe trop court', () => {
      const { validerMotDePasse } = require('../utils/validation');
      expect(validerMotDePasse('abc')).toBe(false);
    });

    it('devrait rejeter sans majuscule', () => {
      const { validerMotDePasse } = require('../utils/validation');
      expect(validerMotDePasse('monpass1')).toBe(false);
    });

    it('devrait rejeter sans chiffre', () => {
      const { validerMotDePasse } = require('../utils/validation');
      expect(validerMotDePasse('MonPasswd')).toBe(false);
    });

    it('devrait accepter un mot de passe valide', () => {
      const { validerMotDePasse } = require('../utils/validation');
      expect(validerMotDePasse('MonPass1')).toBe(true);
    });

    it('devrait rejeter email sans @', () => {
      const { validerEmail } = require('../utils/validation');
      expect(validerEmail('usersansarobas.com')).toBe(false);
    });

    it('devrait accepter email valide', () => {
      const { validerEmail } = require('../utils/validation');
      expect(validerEmail('test@example.com')).toBe(true);
    });

    it('devrait rejeter email vide', () => {
      const { validerEmail } = require('../utils/validation');
      expect(validerEmail('')).toBe(false);
    });

    it('devrait rejeter email avec espaces', () => {
      const { validerEmail } = require('../utils/validation');
      expect(validerEmail('test @example.com')).toBe(false);
    });
  });
});
