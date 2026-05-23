# Flux

Application mobile développée dans le cadre d'un projet intégrateur (Cégep Gérald-Godin). Flux est une app React Native (TypeScript) permettant de suivre des entraînements physiques avec GPS, podomètre et accéléromètre, avec authentification Firebase et connexion Google.

## Technologies

- **React Native 0.76** + TypeScript
- **React Navigation** (stack + bottom tabs + material top tabs)
- **Firebase** : Auth, Firestore, Messaging (`@react-native-firebase/*`)
- **Google Sign-In** (`@react-native-google-signin/google-signin`)
- **Expo** : expo-location (GPS), expo-sensors (podomètre + accéléromètre), expo-constants, expo-asset
- **AsyncStorage** + **EncryptedStorage** (stockage sécurisé)
- **react-native-linear-gradient**, **react-native-gesture-handler**, **react-native-screens**

## Structure du projet

```
src/
├── ecrans/
│   ├── authentification/   # Connexion, Inscription, Code d'accès, Vérification courriel
│   └── principal/          # Accueil, Explorer, Enregistrer, Historique, Profil, Notifications, Suivi
├── fonctionnalites/
│   └── suiviMouvement/     # GPS, podomètre, accéléromètre (hook + composants + calculs)
│       ├── hooks/           # useSuiviMouvement
│       ├── components/      # TableauDeBordSuivi, MiniCarteTrace
│       ├── sensors/         # deviceSensors, simulatedSensors, types
│       └── utils/           # calculations (Haversine, filtres, formatage)
├── navigation/              # NavigateurApp (structure des routes)
├── contextes/               # ContexteAuth, ContexteNotifications
├── composants/              # Composants réutilisables (BoutonPersonnalise, AlertePersonnalisee…)
├── services/                # Chiffrement, rate limiting, migration sécurité
├── config/                  # googleAuth.ts
├── styles/                  # theme.ts
└── utils/                   # validation, notifications, stockage entraînements, jetons push
```

## Prérequis

- Node.js `>= 18`
- Android Studio + SDK Android (pour Android)
- Xcode + CocoaPods (pour iOS, macOS seulement)

## Installation

```bash
npm install
```

## Configuration Firebase

Ce projet utilise Firebase (Auth, Firestore, Messaging) via `@react-native-firebase`.

- **Android** : placer le fichier `google-services.json` dans `android/app/`
- **iOS** : placer `GoogleService-Info.plist` dans `ios/` (si iOS activé)

Ces fichiers de configuration ne sont pas inclus dans le dépôt (clés privées). À ajouter localement pour exécuter l'app.

### Authentification

Flux supporte deux modes de connexion :
1. **Courriel + mot de passe** avec vérification par lien Firebase
2. **Connexion Google** via `@react-native-google-signin/google-signin`

## Démarrage

```bash
# Terminal 1 — démarrer Metro
npm start

# Terminal 2 — lancer sur Android
npm run android
```

Si l'écran est blanc au démarrage, le port Metro (`8081`) est probablement déjà utilisé.  
Ce projet est configuré sur le port `8081` (voir `android/gradle.properties`).

### Réinitialiser le cache Metro (en cas d'erreur de bundler)

```bash
npm run start:reset
```

## Tests

```bash
npm test
```

## Notes

- `node_modules/` est ignoré via `.gitignore`.
- Le module `suiviMouvement` fonctionne en deux modes : **capteurs réels** (GPS natif, podomètre, accéléromètre) et **simulation** (trajectoire préenregistrée autour du Plateau-Mont-Royal, Montréal).
- Projet éducatif : ce dépôt sert au suivi du travail et à la remise.
