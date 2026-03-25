import {validerMotDePasse, validerEmail} from '../utils/validation';

describe('Validation des formulaires', () => {
  test('rejette un mot de passe trop court', () => {
    expect(validerMotDePasse('abc')).toBe(false);
  });
  test('rejette sans majuscule', () => {
    expect(validerMotDePasse('monpass1')).toBe(false);
  });
  test('rejette sans chiffre', () => {
    expect(validerMotDePasse('MonPasswd')).toBe(false);
  });
  test('accepte un mot de passe valide', () => {
    expect(validerMotDePasse('MonPass1')).toBe(true);
  });
  test('rejette email sans @', () => {
    expect(validerEmail('usersansarobas.com')).toBe(false);
  });
  test('accepte email valide', () => {
    expect(validerEmail('test@example.com')).toBe(true);
  });
});

