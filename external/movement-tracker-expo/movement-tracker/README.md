# Movement Tracker — React Native (Expo)

Port du projet Python "PF pour présentation" vers React Native avec Expo.

## Setup

```bash
# Créer le projet (si tu pars de zéro)
npx create-expo-app@latest movement-tracker
cd movement-tracker

# Copier les fichiers src/ et app/ de ce projet dans le tien

# Installer les dépendances capteurs
npx expo install expo-location expo-sensors expo-router expo-status-bar react-native-safe-area-context react-native-screens
```

## Lancer

```bash
npx expo start          # Démarre le dev server
# Scanner le QR code avec Expo Go sur ton téléphone
```

## Mode simulation

Dans `app/index.tsx`, changer `useState(false)` à `useState(true)` pour tester sans téléphone (utilise la trajectoire simulée de Paris, identique à `capteurs_simules.py`).

## Correspondance Python → React Native

| Python (original)                | React Native (nouveau)                   |
|----------------------------------|------------------------------------------|
| `capteurs_base.py`              | `src/sensors/types.ts`                   |
| `capteurs_termux.py`            | `src/sensors/deviceSensors.ts`           |
| `capteurs_simules.py`           | `src/sensors/simulatedSensors.ts`        |
| `capteurs_erreurs.py`           | *(à porter si besoin pour tests)*        |
| `utilitaires.py` (calculs)      | `src/utils/calculations.ts`              |
| `utilitaires.py` (affichage)    | `src/components/Dashboard.tsx`           |
| `principe.py` → `executer_suivi()` | `src/hooks/useSuiviMouvement.ts`      |
| `principe.py` → `main()`        | `app/index.tsx`                          |

## Architecture

```
movement-tracker/
├── app/
│   ├── _layout.tsx          # Layout Expo Router
│   └── index.tsx            # Écran principal (= main())
├── src/
│   ├── sensors/
│   │   ├── types.ts         # Interfaces TypeScript
│   │   ├── deviceSensors.ts # Capteurs réels (Expo APIs)
│   │   ├── simulatedSensors.ts # Trajectoire simulée
│   │   └── index.ts
│   ├── hooks/
│   │   └── useSuiviMouvement.ts # Hook principal
│   ├── utils/
│   │   └── calculations.ts  # Haversine, vitesse, etc.
│   └── components/
│       └── Dashboard.tsx     # UI temps réel
├── app.json                 # Config Expo + permissions
└── package.json
```

## Capteurs utilisés

| Capteur        | API Python (Termux)                    | API React Native (Expo)         |
|----------------|----------------------------------------|---------------------------------|
| GPS            | `termux-location -p gps`              | `expo-location`                 |
| Podomètre      | `termux-sensor -s TYPE_STEP_COUNTER`  | `expo-sensors` → `Pedometer`    |
| Accéléromètre  | `termux-sensor -s TYPE_ACCELEROMETER` | `expo-sensors` → `Accelerometer`|

## Prochaines étapes possibles

- [ ] Ajouter une carte (react-native-maps) pour visualiser le trajet
- [ ] Historique des sessions avec stockage local (AsyncStorage)
- [ ] Graphiques temps réel (accéléromètre, vitesse)
- [ ] Export des données en CSV/JSON
- [ ] Détection d'activité (marche, course, arrêt)
