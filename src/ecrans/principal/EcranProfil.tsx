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

export const EcranProfil = () => {
  const {utilisateur, seDeconnecter, genererCodeAcces} = utiliserAuth();
  const [alerte, setAlerte] = React.useState<EtatAlerteProfil>({
    visible: false,
    type: 'info',
    titre: '',
    message: '',
  });

  const fermerAlerte = React.useCallback(() => {
    setAlerte(etat => ({
      ...etat,
      visible: false,
      onConfirmer: undefined,
      onAnnuler: undefined,
    }));
  }, []);

  const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
    typeof valeur === 'object' && valeur !== null;

  const obtenirChaine = (valeur: unknown): string | undefined =>
    typeof valeur === 'string' ? valeur : undefined;

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
