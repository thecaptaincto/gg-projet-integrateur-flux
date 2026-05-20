// validationFormulaire.test.ts — Tests unitaires des fonctions de validation
// propres aux formulaires de l'app (utils/validationFormulaire).
// Diffère de validation.test.ts par des règles de connexion plus souples (6 caractères min)
// et la vérification du trim automatique sur les courriels.

import {
  estCourrielValide,
  estMotDePasseValideConnexion,
  estMotDePasseValideInscription,
} from '../utils/validationFormulaire';

describe('Validation des formulaires (validationFormulaire)', () => {
  test('estCourrielValide trim les espaces', () => {
    expect(estCourrielValide(' test@example.com ')).toBe(true);
  });

  test('estCourrielValide rejette email invalide', () => {
    expect(estCourrielValide('usersansarobas.com')).toBe(false);
  });

  test('estMotDePasseValideConnexion accepte 6 caractères', () => {
    expect(estMotDePasseValideConnexion('abcdef')).toBe(true);
  });

  test('estMotDePasseValideConnexion rejette < 6 caractères', () => {
    expect(estMotDePasseValideConnexion('abcde')).toBe(false);
  });

  test('estMotDePasseValideInscription rejette sans majuscule', () => {
    expect(estMotDePasseValideInscription('monpass12')).toBe(false);
  });

  test('estMotDePasseValideInscription rejette sans chiffre', () => {
    expect(estMotDePasseValideInscription('MonPasswd')).toBe(false);
  });

  test('estMotDePasseValideInscription accepte un mot de passe valide', () => {
    expect(estMotDePasseValideInscription('MonPass12')).toBe(true);
  });
});

