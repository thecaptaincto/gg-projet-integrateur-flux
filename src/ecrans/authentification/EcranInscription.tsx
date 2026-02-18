import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { utiliserAuth } from '../../contextes/ContexteAuth';

const EcranInscription = ({ navigation }: any) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const { inscrire, chargement } = utiliserAuth();

  const gererInscription = async () => {
    if (motDePasse !== confirmMotDePasse) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await inscrire(email, motDePasse, nom);
      // Navigation automatique après inscription réussie
    } catch (erreur) {
      // Erreur déjà gérée dans le contexte
    }
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Créer un compte</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nom complet"
        value={nom}
        onChangeText={setNom}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Adresse courriel"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe (min. 6 caractères)"
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmMotDePasse}
        onChangeText={setConfirmMotDePasse}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.bouton, chargement && styles.boutonDesactive]}
        onPress={gererInscription}
        disabled={chargement}
      >
        <Text style={styles.texteBouton}>
          {chargement ? 'Inscription...' : 'S\'inscrire'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
        <Text style={styles.lien}>Vous avez déjà un compte? Connexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  titre: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  bouton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  boutonDesactive: {
    backgroundColor: '#ccc',
  },
  texteBouton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  lien: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export { EcranInscription };