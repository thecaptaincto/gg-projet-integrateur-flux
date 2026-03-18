import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {utiliserAuth} from '../contextes/ContexteAuth';
import {EcranAccueil} from '../ecrans/principal/EcranAccueil';
import {EcranInscription} from '../ecrans/authentification/EcranInscription';
import {EcranConnexion} from '../ecrans/authentification/EcranConnexion';
import {EcranPrincipal} from '../ecrans/principal/EcranPrincipal';
import {EcranExplorer} from '../ecrans/principal/EcranExplorer';
import {EcranEnregistrer} from '../ecrans/principal/EcranEnregistrer';
import {EcranNotifications} from '../ecrans/principal/EcranNotifications';
import {EcranProfil} from '../ecrans/principal/EcranProfil';
import {theme} from '../styles/theme';
import {Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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
  OngletEnregistrer: undefined;
  OngletNotifications: undefined;
  OngletProfil: undefined;
};

const Pile = createNativeStackNavigator<TypesPilePrincipale>();

const Onglets = createMaterialTopTabNavigator<TypesOngletsPrincipaux>();

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

const BarreOngletsBas = ({state, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const paddingBas = Math.max(insets.bottom, 24);

  const etiquettes: Record<string, string> = {
    OngletPrincipal: 'Accueil',
    OngletExplorer: 'Explorer',
    OngletEnregistrer: 'Enregistrer',
    OngletNotifications: 'Notifications',
    OngletProfil: 'Profil',
  };

  return (
    <View style={[styles.barreOnglets, {paddingBottom: paddingBas}]}>
      {state.routes.map((route: any, index: number) => {
        const actif = state.index === index;
        const etiquette = etiquettes[route.name] ?? route.name;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            onPress={() => navigation.navigate(route.name)}
            style={styles.boutonOnglet}>
            <IconeOnglet etiquette={etiquette} actif={actif} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const OngletsPrincipaux = () => {
  return (
    <Onglets.Navigator
      id="OngletsPrincipaux"
      tabBarPosition="bottom"
      tabBar={props => <BarreOngletsBas {...props} />}
      screenOptions={{
        swipeEnabled: true,
      }}>
      <Onglets.Screen
        name="OngletPrincipal"
        component={EcranPrincipal}
      />
      <Onglets.Screen
        name="OngletExplorer"
        component={EcranExplorer}
      />
      <Onglets.Screen
        name="OngletEnregistrer"
        component={EcranEnregistrer}
      />
      <Onglets.Screen
        name="OngletNotifications"
        component={EcranNotifications}
      />
      <Onglets.Screen
        name="OngletProfil"
        component={EcranProfil}
      />
    </Onglets.Navigator>
  );
};

export const NavigateurApp = () => {
  const {utilisateur, chargement, premierLancement} = utiliserAuth();

  if (chargement) {
    return null;
  }

  const routeInitiale =
    utilisateur ? 'Principal' : premierLancement ? 'Accueil' : 'Connexion';

  return (
    <NavigationContainer>
      <Pile.Navigator
        id="PilePrincipale"
        initialRouteName={routeInitiale}
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: 'transparent'},
        }}>
        {!utilisateur ? (
          <>
            <Pile.Screen name="Accueil" component={EcranAccueil} />
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
    minHeight: 64,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  boutonOnglet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
