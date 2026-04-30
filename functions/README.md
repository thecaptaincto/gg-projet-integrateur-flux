# Functions Flux

Cette fonction envoie une notification push FCM test a un utilisateur en lisant son `jetonPush` dans Firestore.

## Prerequis

- Le document Firestore doit exister dans `utilisateurs/{uid}`
- Le champ `jetonPush` doit avoir ete enregistre par l'application mobile

## Installation

```bash
cd functions
npm install
```

## Build local

```bash
npm run build
```

## Deploy

```bash
npm run deploy
```

## Endpoint

Fonction HTTP: `envoyerNotificationTest`

Exemple de corps JSON:

```json
{
  "uid": "abc123",
  "titre": "Test Flux",
  "message": "La notification push fonctionne.",
  "donnees": {
    "type": "test",
    "source": "manual"
  }
}
```

Si le token est invalide ou expire, la fonction nettoie `jetonPush` dans Firestore.
