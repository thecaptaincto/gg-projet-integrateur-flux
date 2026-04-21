module.exports = {
  preset: 'react-native',
  // Certains environnements Windows bloquent la création de processus (spawn EPERM).
  // Jest peut fonctionner en utilisant des worker threads + 1 worker.
  maxWorkers: 1,
  workerThreads: true,
  // Exclure les sous-projets présents dans le repo (non liés à l'app RN CLI)
  // pour éviter les collisions Haste et accélérer l'indexation.
  modulePathIgnorePatterns: [
    '<rootDir>/movement-tracker-corrige/',
    '<rootDir>/external/',
    '<rootDir>/movement-tracker-expo/',
  ],
};
