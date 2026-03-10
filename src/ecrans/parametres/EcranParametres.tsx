import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import { theme } from '../../styles/theme';

interface PropsEcranParametres {
  navigation: any;
}

export const EcranParametres: React.FC<PropsEcranParametres> = ({ navigation }) => {
  const parametres = [
    {
      titre: 'Mon compte',
      items: [
        { label: 'Modifier le profil', action: () => navigation.navigate('ModifierProfil') },
        { label: 'Changer le mot de passe', action: () => navigation.navigate('ChangerMotDePasse') },
      ],
    },
    {
      titre: 'Confidentialité',
      items: [
        { label: 'Paramètres de confidentialité', action: () => navigation.navigate('Confidentialite') },
        { label: 'Blocage', action: () => navigation.navigate('Blocage') },
      ],
    },
    {
      titre: 'Notifications',
      items: [
        { label: 'Préférences de notifications', action: () => navigation.navigate('PreferencesNotifications') },
      ],
    },
  ];

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <View style={styles.entete}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.boutonRetour}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Paramètres</Text>
        </View>

        <ScrollView style={styles.scroll}>
          {parametres.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.titreSection}>{section.titre}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.itemParametre}
                  onPress={item.action}>
                  <Text style={styles.texteItem}>{item.label}</Text>
                  <Text style={styles.fleche}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  entete: {
    padding: 20,
  },
  boutonRetour: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.primaire,
    marginBottom: 10,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 32,
    color: theme.couleurs.primaire,
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  titreSection: {
    fontFamily: theme.polices.moyenne,
    fontSize: 18,
    color: 'rgba(253, 226, 255, 0.7)',
    marginBottom: 12,
  },
  itemParametre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.2)',
  },
  texteItem: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.primaire,
  },
  fleche: {
    fontFamily: theme.polices.reguliere,
    fontSize: 24,
    color: 'rgba(253, 226, 255, 0.5)',
  },
});