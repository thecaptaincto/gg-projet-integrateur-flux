#!/usr/bin/env node

/**
 * Script de vérification de sécurité
 * À exécuter avant production
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

console.log('\n🔒 VÉRIFICATION DE SÉCURITÉ - Flux\n');
console.log('=' .repeat(60));

// ✅ CHECK 1: .env existe
const envExists = fs.existsSync(path.join(__dirname, '.env'));
if (envExists) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const hasValue = envContent.includes('GOOGLE_WEB_CLIENT_ID') && 
                   !envContent.includes('votre_id');
  
  if (hasValue) {
    console.log('✅ .env existe et est configuré');
    checks.passed++;
  } else {
    console.log('⚠️  .env existe mais n\'est pas complètement rempli');
    checks.warnings++;
  }
} else {
  console.log('❌ .env n\'existe pas');
  console.log('   → Créer: cp .env.example .env');
  checks.failed++;
}

// ✅ CHECK 2: EncryptedStorage installé
try {
  require('react-native-encrypted-storage');
  console.log('✅ react-native-encrypted-storage installé');
  checks.passed++;
} catch {
  console.log('❌ react-native-encrypted-storage non installé');
  console.log('   → npm install react-native-encrypted-storage');
  checks.failed++;
}

// ✅ CHECK 3: react-native-config installé
try {
  require('react-native-config');
  console.log('✅ react-native-config installé');
  checks.passed++;
} catch {
  console.log('❌ react-native-config non installé');
  console.log('   → npm install react-native-config');
  checks.failed++;
}

// ✅ CHECK 4: .env dans .gitignore
const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
if (gitignore.includes('.env')) {
  console.log('✅ .env est dans .gitignore');
  checks.passed++;
} else {
  console.log('❌ .env n\'est pas dans .gitignore');
  console.log('   → Ajouter ".env" à .gitignore');
  checks.failed++;
}

// ✅ CHECK 5: Fichiers de sécurité créés
const securityFiles = [
  'src/services/serviceChiffrement.ts',
  'src/services/serviceRateLimiting.ts',
  'src/services/migrationSecurite.ts',
];

let allFilesExist = true;
for (const file of securityFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.log(`❌ ${file} manquant`);
    allFilesExist = false;
    checks.failed++;
  }
}
if (allFilesExist) {
  console.log('✅ Tous les fichiers de sécurité présents');
  checks.passed++;
}

// ✅ CHECK 6: Config Google depuis .env
const googleAuthFile = fs.readFileSync(
  path.join(__dirname, 'src/config/googleAuth.ts'),
  'utf8'
);
if (googleAuthFile.includes('react-native-config') && 
    !googleAuthFile.includes('490264637112')) {
  console.log('✅ Config Google depuis variables d\'env');
  checks.passed++;
} else {
  console.log('❌ Config Google encore en dur');
  checks.failed++;
}

// ✅ CHECK 7: Tests de sécurité
const testFile = fs.readFileSync(
  path.join(__dirname, 'src/__tests__/securite.test.ts'),
  'utf8'
);
if (testFile.includes('Rate Limiting') && testFile.includes('Validation')) {
  console.log('✅ Tests de sécurité implémentés');
  checks.passed++;
} else {
  console.log('❌ Tests de sécurité incomplets');
  checks.failed++;
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RÉSUMÉ:`);
console.log(`  ✅ Passés: ${checks.passed}`);
console.log(`  ⚠️  Avertissements: ${checks.warnings}`);
console.log(`  ❌ Échoués: ${checks.failed}`);

if (checks.failed === 0) {
  console.log('\n🎉 PRÊT POUR PRODUCTION!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Veuillez corriger les éléments en échoué.\n');
  process.exit(1);
}
