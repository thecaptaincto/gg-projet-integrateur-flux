# Flux

Application mobile développée dans le cadre d’un projet intégrateur (Cégep Gérald-Godin). Flux est une app React Native (TypeScript) avec authentification, navigation par onglets et plusieurs écrans (accueil, explorer, notifications, profil, paramètres, etc.).

## Technologies

- React Native + TypeScript
- React Navigation (stack + tabs)
- Firebase Auth (`@react-native-firebase/auth`)
- AsyncStorage

## Structure du projet

- `src/ecrans/` : écrans (authentification, principal, paramètres)
- `src/navigation/` : navigateurs / routes
- `src/contextes/` : contextes (ex. auth)
- `src/composants/` : composants réutilisables
- `src/styles/` : thème et styles

## Prérequis

- Node.js `>= 18`
- Android Studio + SDK Android (pour Android)
- Xcode + CocoaPods (pour iOS, sur macOS seulement)

## Installation

```bash
npm install
```

## Configuration Firebase (auth)

Ce projet utilise Firebase Authentication via `@react-native-firebase`.

- Android : placer le fichier `google-services.json` dans `android/app/`
- iOS : placer `GoogleService-Info.plist` dans `ios/` (si vous activez iOS)

Note : pour une remise/projet partagé, ces fichiers de configuration Firebase ne devraient pas être inclus (clés/configs). Ajoutez-les localement si vous souhaitez exécuter l’app.

## Démarrage

Dans un terminal :

```bash
npx react-native start --reset-cache
```

Dans un autre terminal (pour appareil Android):

```bash
npx react-native run-android
```

## Tests

```bash
npm test
```

## Notes

- `node_modules/` est ignoré via `.gitignore`.
- Projet éducatif : ce dépôt sert au suivi du travail et à la remise.
