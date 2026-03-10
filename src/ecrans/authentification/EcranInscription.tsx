import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { utiliserAuth } from '../../contextes/ContexteAuth';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import { AlertePersonnalisee } from '../../composants/AlertePersonnalisee';

const EcranInscription = ({ navigation }: any) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const { inscrire, chargement } = utiliserAuth();
  
  const [alerte, setAlerte] = useState({
    visible: false,
    titre: '',
    message: '',
    type: 'error' as 'error' | 'success',
  });

  const afficherAlerte = (titre: string, message: string, type: 'error' | 'success' = 'error') => {
    setAlerte({ visible: true, titre, message, type });
  };

  const gererInscription = async () => {
    if (motDePasse !== confirmMotDePasse) {
      afficherAlerte('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await inscrire(email, motDePasse, nom);
    } catch (erreur: any) {
      if (erreur.code === 'success') {
        afficherAlerte('Succès', erreur.message, 'success');
      } else {
        afficherAlerte('Erreur d\'inscription', erreur.message || 'Une erreur est survenue');
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
          <Text style={styles.titre}>Créer un compte</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor="rgba(253, 226, 255, 0.5)"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
          />

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
            placeholder="Mot de passe (min. 6 caractères)"
            placeholderTextColor="rgba(253, 226, 255, 0.5)"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="rgba(253, 226, 255, 0.5)"
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
});

export { EcranInscription };