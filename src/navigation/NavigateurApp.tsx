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
import {EcranSuiviMouvement} from '../ecrans/principal/EcranSuiviMouvement';
import {EcranHistorique} from '../ecrans/principal/EcranHistorique';
import {theme} from '../styles/theme';
import {Text, View, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Typage strict des routes pour détecter les fautes de navigation à la compilation
type TypesPilePrincipale = {
  Accueil: undefined;
  Inscription: undefined;
  Connexion: undefined;
  Principal: undefined;
  SuiviMouvement: undefined;
  Historique: undefined;
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

// Icône personnalisée pour les onglets : un point indicateur au-dessus de l'étiquette.
// Le point devient plus grand et change de couleur lorsque l'onglet est actif.
const IconeOnglet = ({etiquette, actif}: {etiquette: string; actif: boolean}) => (
  <View style={styles.conteneurIconeOnglet}>
    <View
      style={[
        styles.pointIconeOnglet,
        actif && styles.pointIconeOngletActif,
      ]}
    />
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[
        styles.texteIconeOnglet,
        actif && styles.texteIconeOngletActif,
        etiquette.length > 11 && styles.texteIconeOngletLong,
        actif && etiquette.length > 11 && styles.texteIconeOngletLongActif,
      ]}>
      {etiquette}
    </Text>
  </View>
);

// Barre d'onglets personnalisée positionnée en bas de l'écran.
// Remplace la tabBar par défaut de MaterialTopTabs pour obtenir
// un rendu visuel cohérent avec le thème violet de l'application.
const BarreOngletsBas = ({state, navigation}: any) => {
  const insets = useSafeAreaInsets();
  // On respecte au minimum 24px de padding pour les appareils sans encoche
  const paddingBas = Math.max(insets.bottom, 24);

  // Dictionnaire de traduction nom de route → étiquette affichée.
  // Découple les noms techniques des routes des libellés visibles par l'utilisateur.
  const etiquettes: Record<string, string> = {
    OngletPrincipal: 'Accueil',
    OngletExplorer: 'Explorer',
    OngletEnregistrer: 'Enregistrer',
    OngletNotifications: 'Notifications',
    OngletProfil: 'Profil',
  };

  return (
    <View style={[styles.barreOnglets, {paddingBottom: paddingBas}]}>
      {/* Itération sur les routes déclarées dans OngletsPrincipaux.
          state.index identifie l'onglet actuellement actif. */}
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

// Navigateur à onglets de l'application principale.
// tabBarPosition="bottom" est ignoré visuellement car tabBar est remplacé par BarreOngletsBas,
// mais il est conservé pour la logique interne de MaterialTopTabNavigator.
// swipeEnabled permet de glisser horizontalement entre les écrans.
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

// Composant racine de navigation. Trois scénarios possibles au démarrage :
//   1. Utilisateur connecté             → route 'Principal' (onglets du bas)
//   2. Premier lancement (jamais ouvert) → route 'Accueil'  (écran de bienvenue)
//   3. Déjà venu mais déconnecté        → route 'Connexion' (formulaire direct)
export const NavigateurApp = () => {
  const {utilisateur, chargement, premierLancement} = utiliserAuth();

  // On attend que Firebase confirme l'état de session avant d'afficher quoi que ce soit
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
          // Transparent pour laisser le dégradé ArrierePlanGradient s'afficher
          contentStyle: {backgroundColor: 'transparent'},
        }}>
        {/* Rendu conditionnel : les écrans d'auth et les écrans principaux sont
            mutuellement exclusifs selon l'état de connexion de l'utilisateur */}
        {!utilisateur ? (
          <>
            <Pile.Screen name="Accueil" component={EcranAccueil} />
            <Pile.Screen name="Inscription" component={EcranInscription} />
            <Pile.Screen name="Connexion" component={EcranConnexion} />
          </>
        ) : (
          <>
            <Pile.Screen name="Principal" component={OngletsPrincipaux} />
            <Pile.Screen
              name="SuiviMouvement"
              component={EcranSuiviMouvement}
            />
            <Pile.Screen
              name="Historique"
              component={EcranHistorique}
            />
          </>
        )}
      </Pile.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  // Barre sombre calquée sur la couleur de début du dégradé pour une transition visuelle fluide
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
  // flex:1 distribue l'espace horizontal équitablement entre les 5 onglets
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
  // Point indicateur inactif : petit et semi-transparent
  pointIconeOnglet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(253, 226, 255, 0.3)',
    marginBottom: 4,
  },
  // Point actif : légèrement plus grand et couleur primaire pour attirer l'œil
  pointIconeOngletActif: {
    backgroundColor: theme.couleurs.primaire,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Étiquette inactive : grisée pour indiquer visuellement qu'elle est sélectionnable
  texteIconeOnglet: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: 'rgba(253, 226, 255, 0.5)',
    flexShrink: 1,
  },
  // Étiquette active : couleur vive et légèrement plus grande
  texteIconeOngletActif: {
    color: theme.couleurs.primaire,
    fontSize: 13,
  },
  // Pour les libellés longs (ex: "Notifications") : éviter le retour à la ligne.
  texteIconeOngletLong: {
    fontSize: 11,
  },
  texteIconeOngletLongActif: {
    fontSize: 12,
  },
});
