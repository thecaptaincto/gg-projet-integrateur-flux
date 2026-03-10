import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { utiliserAuth } from '../../contextes/ContexteAuth';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import { AlertePersonnalisee } from '../../composants/AlertePersonnalisee';

const EcranConnexion = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const { seConnecter, reinitialiserMotDePasse, chargement } = utiliserAuth();
  
  // État pour l'alerte personnalisée
  const [alerte, setAlerte] = useState({
    visible: false,
    titre: '',
    message: '',
    type: 'error' as 'error' | 'success',
  });

  const afficherAlerte = (titre: string, message: string, type: 'error' | 'success' = 'error') => {
    setAlerte({ visible: true, titre, message, type });
  };

  const gererConnexion = async () => {
    try {
      await seConnecter(email, motDePasse);
    } catch (erreur: any) {
      afficherAlerte('Erreur de connexion', erreur.message || 'Une erreur est survenue');
    }
  };

  const gererMotDePasseOublie = async () => {
    if (!email) {
      afficherAlerte('Attention', 'Veuillez entrer votre adresse courriel d\'abord');
      return;
    }

    try {
      await reinitialiserMotDePasse(email);
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        afficherAlerte('Succès', erreur.message, 'success');
      } else {
        afficherAlerte('Erreur', erreur.message);
      }
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <TouchableOpacity 
          style={styles.boutonRetour}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.texteRetour}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.contenuCentre}>
          <Text style={styles.titre}>Connexion</Text>

          <TextInput
            style={styles.input}
            placeholder="Adresse courriel"
            placeholderTextColor="rgba(253, 226, 255, 0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="rgba(253, 226, 255, 0.5)"
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

        {/* Alerte personnalisée */}
        <AlertePersonnalisee
          visible={alerte.visible}
          titre={alerte.titre}
          message={alerte.message}
          boutons={[{
            texte: 'OK',
            onPress: () => {},
            style: alerte.type === 'success' ? 'primaire' : 'secondaire',
          }]}
          onFermer={() => setAlerte({ ...alerte, visible: false })}
        />
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  boutonRetour: {
    padding: 20,
    alignSelf: 'flex-start',
  },
  texteRetour: {
    fontFamily: 'LilitaOne-Regular',
    fontSize: 18,
    color: '#FDE2FF',
  },
  contenuCentre: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  titre: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'LilitaOne-Regular',
    marginBottom: 30,
    textAlign: 'center',
    color: '#FDE2FF',
  },
  input: {
    fontFamily: 'LilitaOne-Regular',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    color: '#FDE2FF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  bouton: {
    backgroundColor: '#a855f7',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  boutonDesactive: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  texteBouton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'LilitaOne-Regular',
  },
  lien: {
    fontFamily: 'LilitaOne-Regular',
    color: '#FDE2FF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  lienOublie: {
    fontFamily: 'LilitaOne-Regular',
    color: '#FDE2FF',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
  },
});

export { EcranConnexion };