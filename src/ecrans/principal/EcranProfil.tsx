import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {BoutonPersonnalise} from '../../composants/BoutonPersonnalise';
import {
  AlertePersonnalisee,
  TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';
import auth from '@react-native-firebase/auth';

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
  const navigation = useNavigation<any>();
  const {
    utilisateur,
    courrielVerifie,
    envoyerCourrielVerification,
    seDeconnecter,
    genererCodeAcces,
  } = utiliserAuth();
  const [editionProfilVisible, setEditionProfilVisible] = React.useState(false);
  const [nomProfil, setNomProfil] = React.useState(
    utilisateur?.displayName ?? '',
  );
  const email = utilisateur?.email ?? auth().currentUser?.email ?? '';
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
        message: `Votre code: ${code}\n\nAstuce : garde-le dans un endroit sûr.`,
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

  const ouvrirParametres = () => navigation.navigate('Parametres');
  const ouvrirHistorique = () => navigation.navigate('Historique');

  const gererRenvoyerVerification = async () => {
    try {
      await envoyerCourrielVerification();
      setAlerte({
        visible: true,
        type: 'info',
        titre: 'Courriel envoyé',
        message: `Un courriel de vérification avec un lien a été envoyé à ${email}. Vérifie aussi les indésirables.`,
        texteConfirmer: 'OK',
        onConfirmer: fermerAlerte,
        onAnnuler: fermerAlerte,
      });
    } catch (erreur: unknown) {
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
      setAlerte({
        visible: true,
        type: 'erreur',
        titre: 'Erreur',
        message: message ?? "Impossible d'envoyer le courriel.",
        texteConfirmer: 'OK',
        onConfirmer: fermerAlerte,
        onAnnuler: fermerAlerte,
      });
    }
  };

  const sauvegarderNom = async () => {
    try {
      const nouveauNom = nomProfil.trim();
      if (nouveauNom.length < 2) {
        setAlerte({
          visible: true,
          type: 'attention',
          titre: 'Attention',
          message: 'Le nom doit contenir au moins 2 caractères.',
          texteConfirmer: 'OK',
          onConfirmer: fermerAlerte,
          onAnnuler: fermerAlerte,
        });
        return;
      }

      const user = auth().currentUser;
      if (!user) {
        throw new Error('Aucun utilisateur connecté.');
      }
      await user.updateProfile({displayName: nouveauNom});
      await user.reload();
      setEditionProfilVisible(false);
      setAlerte({
        visible: true,
        type: 'info',
        titre: 'Profil mis à jour',
        message: 'Ton nom a été enregistré.',
        texteConfirmer: 'OK',
        onConfirmer: fermerAlerte,
        onAnnuler: fermerAlerte,
      });
    } catch (erreur: unknown) {
      const message =
        estObjet(erreur) ? obtenirChaine(erreur.message) : undefined;
      setAlerte({
        visible: true,
        type: 'erreur',
        titre: 'Erreur',
        message: message ?? 'Impossible de modifier le profil.',
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
                {email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.nomUtilisateur} numberOfLines={1}>
              {utilisateur?.displayName || email?.split('@')[0] || 'Utilisateur'}
            </Text>
            <Text style={styles.courriel} numberOfLines={1}>
              {email}
            </Text>
            <View style={styles.badges}>
              <View
                style={[
                  styles.badge,
                  courrielVerifie ? styles.badgeOk : styles.badgeKo,
                ]}>
                <Text style={styles.badgeTexte}>
                  {courrielVerifie ? 'Courriel vérifié' : 'Courriel non vérifié'}
                </Text>
              </View>
              {!courrielVerifie ? (
                <TouchableOpacity
                  style={styles.badgeAction}
                  onPress={() => void gererRenvoyerVerification()}>
                  <Text style={styles.badgeActionTexte}>Renvoyer</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.actionsRapides}>
            <TouchableOpacity
              style={styles.actionRapide}
              onPress={ouvrirHistorique}>
              <Text style={styles.actionRapideTexte}>Historique</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRapide}
              onPress={ouvrirParametres}>
              <Text style={styles.actionRapideTexte}>Paramètres</Text>
            </TouchableOpacity>
          </View>

          {/* Section Paramètres — les trois premiers éléments n'ont pas encore de onPress
              (fonctionnalités à implémenter), seul "Générer un code d'accès" est actif */}
          <View style={styles.section}>
            <Text style={styles.titreSection}>Paramètres</Text>

            <TouchableOpacity
              style={styles.elementMenu}
              onPress={() => setEditionProfilVisible(true)}>
              <Text style={styles.texteMenu}>Modifier le profil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu} onPress={ouvrirParametres}>
              <Text style={styles.texteMenu}>Confidentialité</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.elementMenu} onPress={ouvrirParametres}>
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

            <TouchableOpacity
              style={styles.elementMenu}
              onPress={() =>
                setAlerte({
                  visible: true,
                  type: 'info',
                  titre: 'Aide & FAQ',
                  message:
                    "Bientôt : une FAQ et des astuces d'utilisation directement dans l'app.",
                  texteConfirmer: 'OK',
                  onConfirmer: fermerAlerte,
                  onAnnuler: fermerAlerte,
                })
              }>
              <Text style={styles.texteMenu}>Aide & FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.elementMenu}
              onPress={() =>
                setAlerte({
                  visible: true,
                  type: 'info',
                  titre: 'À propos',
                  message:
                    'Flux — projet intégrateur.\n\nProchaine étape : Google Sign-In + défis Explorer.',
                  texteConfirmer: 'OK',
                  onConfirmer: fermerAlerte,
                  onAnnuler: fermerAlerte,
                })
              }>
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

        {editionProfilVisible ? (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitre}>Modifier le profil</Text>
              <Text style={styles.modalLabel}>Nom affiché</Text>
              <TextInput
                value={nomProfil}
                onChangeText={setNomProfil}
                placeholder="Ex: Carl"
                placeholderTextColor={theme.couleurs.placeholder}
                style={styles.modalInput}
                autoCapitalize="words"
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={() => void sauvegarderNom()}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBouton, styles.modalBoutonSecondaire]}
                  onPress={() => setEditionProfilVisible(false)}>
                  <Text style={styles.modalBoutonSecondaireTexte}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBouton, styles.modalBoutonPrimaire]}
                  onPress={() => void sauvegarderNom()}>
                  <Text style={styles.modalBoutonPrimaireTexte}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
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
  nomUtilisateur: {
    fontFamily: theme.polices.grasse,
    fontSize: 20,
    color: theme.couleurs.texte,
    marginBottom: 6,
  },
  courriel: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texteClair,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espacement.sm,
    marginTop: theme.espacement.md,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOk: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  badgeKo: {
    backgroundColor: 'rgba(255, 107, 107, 0.18)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  badgeTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texte,
  },
  badgeAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
  },
  badgeActionTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texte,
  },
  actionsRapides: {
    flexDirection: 'row',
    gap: theme.espacement.md,
    marginBottom: theme.espacement.xl,
  },
  actionRapide: {
    flex: 1,
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: theme.rayonBordure.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionRapideTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texte,
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.couleurs.overlayModal,
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.lg,
  },
  modal: {
    backgroundColor: theme.couleurs.milieuGradient,
    borderRadius: theme.rayonBordure.lg,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureTransparente,
    padding: theme.espacement.lg,
  },
  modalTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    color: theme.couleurs.texte,
    textAlign: 'center',
    marginBottom: theme.espacement.md,
  },
  modalLabel: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.couleurs.champBordure,
    backgroundColor: theme.couleurs.champFond,
    color: theme.couleurs.texteClair,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.espacement.md,
    marginTop: theme.espacement.lg,
  },
  modalBouton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBoutonPrimaire: {
    backgroundColor: theme.couleurs.violetAccent,
  },
  modalBoutonSecondaire: {
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.35)',
    backgroundColor: 'rgba(253, 226, 255, 0.12)',
  },
  modalBoutonPrimaireTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 16,
  },
  modalBoutonSecondaireTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 16,
  },
});
