import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {BoutonPersonnalise} from '../../composants/BoutonPersonnalise';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

export const EcranProfil = () => {
  const {utilisateur, seDeconnecter, genererCodeAcces} = utiliserAuth();

  const gererDeconnexion = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await seDeconnecter();
            } catch (erreur) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ],
    );
  };

  const gererGenerationCode = async () => {
    try {
      const code = await genererCodeAcces();
      Alert.alert(
        'Code d\'accès généré',
        `Votre code: ${code}\n\nValide pour 5 minutes`,
        [{text: 'OK'}],
      );
    } catch (erreur) {
      Alert.alert('Erreur', 'Impossible de générer le code');
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>PROFIL</Text>

          <View style={styles.carteProfil}>
            <View style={styles.avatar}>
              <Text style={styles.texteAvatar}>
                {utilisateur?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.courriel}>{utilisateur?.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Paramètres</Text>
            
            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>Modifier le profil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>Confidentialité</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.elementMenu}
              onPress={gererGenerationCode}>
              <Text style={styles.texteMenu}>Générer un code d'accès</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.titreSection}>Support</Text>
            
            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>Aide & FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>À propos</Text>
            </TouchableOpacity>
          </View>

          <BoutonPersonnalise
            titre="DÉCONNEXION"
            auClic={gererDeconnexion}
            variante="secondaire"
            style={styles.boutonDeconnexion}
          />
        </ScrollView>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  contenuScroll: {
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.lg,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 48,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.xl,
  },
  carteProfil: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    alignItems: 'center',
    marginBottom: theme.espacement.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.espacement.md,
  },
  texteAvatar: {
    fontFamily: theme.polices.reguliere,
    fontSize: 36,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  courriel: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texteClair,
  },
  section: {
    marginBottom: theme.espacement.xl,
  },
  titreSection: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: theme.couleurs.texteClair,
    marginBottom: theme.espacement.md,
  },
  elementMenu: {
    backgroundColor: 'rgba(253, 226, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.2)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    marginBottom: theme.espacement.sm,
  },
  texteMenu: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texte,
  },
  boutonDeconnexion: {
    marginTop: theme.espacement.lg,
  },
});