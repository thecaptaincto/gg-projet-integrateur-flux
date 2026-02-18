import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { utiliserAuth } from '../../contextes/ContexteAuth';

const EcranConnexion = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const { seConnecter, reinitialiserMotDePasse, chargement } = utiliserAuth();

  const gererConnexion = async () => {
    try {
      await seConnecter(email, motDePasse);
    } catch (erreur) {
      // Erreur déjà gérée
    }
  };

  const gererMotDePasseOublie = async () => {
    if (!email) {
      Alert.alert('Attention', 'Veuillez entrer votre adresse courriel');
      return;
    }

    try {
      await reinitialiserMotDePasse(email);
    } catch (erreur) {
      // Erreur déjà gérée
    }
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Connexion</Text>

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
        placeholder="Mot de passe"
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={gererMotDePasseOublie}>
        <Text style={styles.lienOublie}>Mot de passe oublié?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, chargement && styles.boutonDesactive]}
        onPress={gererConnexion}
        disabled={chargement}
      >
        <Text style={styles.texteBouton}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Inscription')}>
        <Text style={styles.lien}>Pas encore de compte? Inscrivez-vous</Text>
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
  lienOublie: {
    color: '#007AFF',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
});

export { EcranConnexion };