# 🔐 GUIDE DE SÉCURITÉ - Flux

## Configuration d'Urgence Requise

### 1. Variables d'Environnement (.env)
**CRITIQUE**: Ne JAMAIS commiter le fichier `.env` dans git

```bash
# Copier .env.example en .env
cp .env.example .env

# Remplir avec vos vraies valeurs
GOOGLE_WEB_CLIENT_ID=votre_id
GOOGLE_IOS_CLIENT_ID=votre_id
ENCRYPTION_SECRET_KEY=une_clé_secrète_longue_et_aléatoire
```

### 2. Google API - Révoquer la clé exposée
🚨 **La clé précédente a été exposée publiquement**

Étapes:
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner votre projet
3. Aller à `APIs & Services > Credentials`
4. Trouver et supprimer l'ancienne clé
5. Créer une nouvelle clé avec restrictions:
   - Android: SHA-256 de votre keystore
   - iOS: Bundle ID

### 3. Code d'Accès Local
Le code d'accès est maintenant:
- **8 chiffres** (vs 6 avant) = 100 millions combinaisons
- **Chiffré** avec `EncryptedStorage` (vs clair avant)
- **Protégé** contre brute force avec délai exponentiel

### 4. Rate Limiting - Protégé contre Brute Force
```typescript
// Automatique: après 5 tentatives échouées
// - 1ère: Immédiat
// - 2ème: 2s
// - 3ème: 4s
// - 4ème: 8s
// - 5ème: Verrouillé 16s (augmente exponentiellement)
```

### 5. Messages d'Erreur Génériques
Les messages ne révèlent plus:
- Si un email existe
- Si un mot de passe était presque bon

Avant: `"Aucun compte trouvé avec cette adresse"`
Après: `"Courriel ou mot de passe incorrect"`

---

## Checklist de Sécurité Avant Production

- [ ] `.env` créé et rempli
- [ ] `.env` dans `.gitignore` ✅ (déjà fait)
- [ ] Google API key rénovée et restreinte
- [ ] Firestore Rules validées (voir firebase.json)
- [ ] Tests de sécurité passés
- [ ] Code d'accès généré au premier lancement (à tester)
- [ ] EncryptedStorage fonctionne sur les appareils de test

---

## Dépendances de Sécurité Installées

```json
{
  "react-native-encrypted-storage": "^4.0.0",
  "react-native-config": "^1.5.0"
}
```

---

## Code d'Accès - Première Utilisation

Le code est généré automatiquement à la première visite de l'écran "Sécurité".

Pour le régénérer:
```typescript
const nouveauCode = await genererCodeAcces();
console.log('Nouveau code:', nouveauCode);
```

---

## Limitations & Conseils

### ✅ Bien Fait
- Code chiffré en local
- Rate limiting côté client
- Validation stricte des données
- Messages d'erreur génériques

### ⚠️ À Améliorer (Phase 2)
- [ ] Ajouter Sentry pour logging d'erreurs
- [ ] Valider côté Cloud Functions (backend)
- [ ] Chiffrer tokens push dans Firestore
- [ ] Implémenter 2FA au niveau serveur
- [ ] Tests de pénétration

---

## Support
En cas de problème de sécurité ou crash:
1. Vérifier les logs: `adb logcat` (Android) ou Xcode (iOS)
2. Vérifier que `.env` existe
3. Vérifier que `EncryptedStorage` n'a pas levé d'exception

---

**Dernière mise à jour:** 2026-04-30
