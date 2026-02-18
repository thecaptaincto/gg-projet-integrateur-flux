import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {utiliserAuth} from '../contextes/ContexteAuth';
import {EcranAccueil} from '../ecrans/principal/EcranAccueil';
import {EcranInscription} from '../ecrans/authentification/EcranInscription';
import {EcranConnexion} from '../ecrans/authentification/EcranConnexion';
import {EcranPrincipal} from '../ecrans/principal/EcranPrincipal';
import {EcranExplorer} from '../ecrans/principal/EcranExplorer';
import {EcranNotifications} from '../ecrans/principal/EcranNotifications';
import {EcranProfil} from '../ecrans/principal/EcranProfil';
import {theme} from '../styles/theme';
import {Text, View, StyleSheet} from 'react-native';

// Définir les types de navigation
type TypesPilePrincipale = {
  Accueil: undefined;
  Inscription: undefined;
  Connexion: undefined;
  Principal: undefined;
};

type TypesOngletsPrincipaux = {
  OngletPrincipal: undefined;
  OngletExplorer: undefined;
  OngletNotifications: undefined;
  OngletProfil: undefined;
};

const Pile = createNativeStackNavigator<TypesPilePrincipale>();
const Onglets = createBottomTabNavigator<TypesOngletsPrincipaux>();

// Icône personnalisée pour les onglets
const IconeOnglet = ({etiquette, actif}: {etiquette: string; actif: boolean}) => (
  <View style={styles.conteneurIconeOnglet}>
    <View
      style={[
        styles.pointIconeOnglet,
        actif && styles.pointIconeOngletActif,
      ]}
    />
    <Text
      style={[
        styles.texteIconeOnglet,
        actif && styles.texteIconeOngletActif,
      ]}>
      {etiquette}
    </Text>
  </View>
);

const OngletsPrincipaux = () => {
  return (
    <Onglets.Navigator
      id="OngletsPrincipaux"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.barreOnglets,
        tabBarActiveTintColor: theme.couleurs.primaire,
        tabBarInactiveTintColor: 'rgba(253, 226, 255, 0.5)',
        tabBarShowLabel: false,
      }}>
      <Onglets.Screen
        name="OngletPrincipal"
        component={EcranPrincipal}
        options={{
          tabBarIcon: ({focused}) => (
            <IconeOnglet etiquette="Accueil" actif={focused} />
          ),
        }}
      />
      <Onglets.Screen
        name="OngletExplorer"
        component={EcranExplorer}
        options={{
          tabBarIcon: ({focused}) => (
            <IconeOnglet etiquette="Explorer" actif={focused} />
          ),
        }}
      />
      <Onglets.Screen
        name="OngletNotifications"
        component={EcranNotifications}
        options={{
          tabBarIcon: ({focused}) => (
            <IconeOnglet etiquette="Notifications" actif={focused} />
          ),
        }}
      />
      <Onglets.Screen
        name="OngletProfil"
        component={EcranProfil}
        options={{
          tabBarIcon: ({focused}) => (
            <IconeOnglet etiquette="Profil" actif={focused} />
          ),
        }}
      />
    </Onglets.Navigator>
  );
};

export const NavigateurApp = () => {
  const {utilisateur, chargement, premierLancement} = utiliserAuth();

  if (chargement) {
    return null;
  }

  return (
    <NavigationContainer>
      <Pile.Navigator
        id="PilePrincipale"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: 'transparent'},
        }}>
        {!utilisateur ? (
          <>
            {premierLancement && (
              <Pile.Screen name="Accueil" component={EcranAccueil} />
            )}
            <Pile.Screen name="Inscription" component={EcranInscription} />
            <Pile.Screen name="Connexion" component={EcranConnexion} />
          </>
        ) : (
          <Pile.Screen name="Principal" component={OngletsPrincipaux} />
        )}
      </Pile.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  barreOnglets: {
    backgroundColor: '#1a0024',
    borderTopWidth: 2,
    borderTopColor: 'rgba(253, 226, 255, 0.2)',
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  conteneurIconeOnglet: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIconeOnglet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(253, 226, 255, 0.3)',
    marginBottom: 4,
  },
  pointIconeOngletActif: {
    backgroundColor: theme.couleurs.primaire,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  texteIconeOnglet: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: 'rgba(253, 226, 255, 0.5)',
  },
  texteIconeOngletActif: {
    color: theme.couleurs.primaire,
    fontSize: 13,
  },
});