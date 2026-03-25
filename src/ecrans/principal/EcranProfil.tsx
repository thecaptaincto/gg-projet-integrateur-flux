import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {BoutonPersonnalise} from '../../composants/BoutonPersonnalise';
import {
  AlertePersonnalisee,
  TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

// Structure étendue par rapport aux autres écrans : les callbacks onConfirmer/onAnnuler
// sont inclus dans l'état pour que chaque modale (déconnexion, code d'accès, erreur)
// puisse définir son propre comportement sans variables de fermeture supplémentaires
interface EtatAlerteProfil {
  visible: boolean;
  type: TypeAlertePersonnalisee;
  titre: string;
  message: string;
  texteConfirmer?: string;
  texteAnnuler?: string;
  onConfirmer?: () => void;
  onAnnuler?: () => void;
}

// Écran de profil utilisateur : affiche l'avatar (initiale du courriel),
// les paramètres du compte, la section support et le bouton de déconnexion.
// L'état `alerte` gère toutes les modales (confirmation de déconnexion,
// affichage du code d'accès, messages d'erreur) depuis un seul objet d'état.
export const EcranProfil = () => {
  const {utilisateur, seDeconnecter, genererCodeAcces} = utiliserAuth();
  const [alerte, setAlerte] = React.useState<EtatAlerteProfil>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  // useCallback mémoïse la fermeture pour éviter des re-rendus inutiles des composants
  // qui reçoivent cette fonction en prop (AlertePersonnalisee notamment).
  // On réinitialise aussi les callbacks pour éviter des fermetures stale.
  const fermerAlerte = React.useCallback(() => {
    setAlerte(etat => ({
      ...etat,
      visible: false,
      onConfirmer: undefined,
      onAnnuler: undefined,
    }));
  }, []);

  // Gardes de type locales pour extraire des valeurs d'un objet d'erreur inconnu
  const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
    typeof valeur === 'object' && valeur !== null;

  const obtenirChaine = (valeur: unknown): string | undefined =>
    typeof valeur === 'string' ? valeur : undefined;

  // Déconnexion en deux étapes : d'abord une alerte de type 'confirmation'
  // demande à l'utilisateur de valider, puis `confirmerDeconnexion` exécute
  // la déconnexion réelle et gère l'erreur si elle survient.
  const gererDeconnexion = () => {
    const confirmerDeconnexion = async () => {
      fermerAlerte();
      try {
        await seDeconnecter();
      } catch (erreur: unknown) {
        const message =
          estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
        setAlerte({
          visible: true,
          type: 'avertissement',
          titre: 'Erreur',
          message: message ?? 'Impossible de se déconnecter.',
          texteConfirmer: 'OK',
          onConfirmer: fermerAlerte,
          onAnnuler: fermerAlerte,
        });
      }
    };

    setAlerte({
      visible: true,
      type: 'confirmation',
      titre: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter?',
      texteAnnuler: 'Annuler',
      texteConfirmer: 'Déconnexion',
      onAnnuler: fermerAlerte,
      onConfirmer: () => {
        void confirmerDeconnexion();
      },
    });
  };

  // Génère un code à 6 chiffres via le contexte et l'affiche dans une modale info.
  // Note : le message indique "5 minutes" mais ce délai n'est pas encore appliqué côté code
  const gererGenerationCode = async () => {
    try {
      const code = await genererCodeAcces();
      setAlerte({
        visible: true,
        type: 'info',
        titre: "Code d'accès généré",
        message: `Votre code: ${code}\n\nValide pour 5 minutes`,
        texteConfirmer: 'OK',
        onConfirmer: fermerAlerte,
        onAnnuler: fermerAlerte,
      });
    } catch (erreur: unknown) {
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
      setAlerte({
        visible: true,
        type: 'avertissement',
        titre: 'Erreur',
        message: message ?? 'Impossible de générer le code.',
        texteConfirmer: 'OK',
        onConfirmer: fermerAlerte,
        onAnnuler: fermerAlerte,
      });
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <Text style={styles.titre}>PROFIL</Text>

          {/* Avatar généré dynamiquement à partir de la première lettre du courriel,
              en majuscule, faute d'une vraie photo de profil */}
          <View style={styles.carteProfil}>
            <View style={styles.avatar}>
              <Text style={styles.texteAvatar}>
                {utilisateur?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.courriel}>{utilisateur?.email}</Text>
          </View>

          {/* Section Paramètres — les trois premiers éléments n'ont pas encore de onPress
              (fonctionnalités à implémenter), seul "Générer un code d'accès" est actif */}
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

          {/* Section Support — éléments de menu sans action implémentée pour l'instant */}
          <View style={styles.section}>
            <Text style={styles.titreSection}>Support</Text>

            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>Aide & FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu}>
              <Text style={styles.texteMenu}>À propos</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton secondaire (transparent + bordure) pour signaler visuellement
              que la déconnexion est une action destructrice */}
          <BoutonPersonnalise
            titre="DÉCONNEXION"
            auClic={gererDeconnexion}
            variante="secondaire"
            style={styles.boutonDeconnexion}
          />
        </ScrollView>

        {/* Modale placée hors du ScrollView pour se superposer à tout l'écran.
            Les callbacks proviennent directement de l'état pour supporter
            des comportements différents selon la situation (déconnexion vs code d'accès) */}
        <AlertePersonnalisee
          visible={alerte.visible}
          type={alerte.type}
          titre={alerte.titre}
          message={alerte.message}
          texteConfirmer={alerte.texteConfirmer}
          texteAnnuler={alerte.texteAnnuler}
          onConfirmer={alerte.onConfirmer}
          onAnnuler={alerte.onAnnuler}
        />
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
  // Carte centrale de l'utilisateur : fond très légèrement teinté avec bordure subtile
  carteProfil: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    alignItems: 'center',
    marginBottom: theme.espacement.xl,
  },
  // Cercle parfait : borderRadius = moitié de width/height (80/2 = 40)
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
  // Fond encore plus transparent que carteProfil pour créer une hiérarchie visuelle claire
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
