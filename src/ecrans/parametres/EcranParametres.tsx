import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { ArrierePlanGradient } from '../../composants/ArrierePlanGradient';
import {AlertePersonnalisee} from '../../composants/AlertePersonnalisee';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

interface PropsEcranParametres {
  navigation: any;
}

export const EcranParametres: React.FC<PropsEcranParametres> = ({ navigation }) => {
  const [sectionMonCompteOuverte, setSectionMonCompteOuverte] = useState(true);
  const [sectionConfidentialiteOuverte, setSectionConfidentialiteOuverte] =
    useState(true);
  const [sectionNotificationsOuverte, setSectionNotificationsOuverte] =
    useState(true);

  const [profilPublic, setProfilPublic] = useState(true);
  const [partagerStats, setPartagerStats] = useState(true);
  const [notifsActives, setNotifsActives] = useState(true);
  const [notifsActivites, setNotifsActivites] = useState(true);

  const [alerte, setAlerte] = useState<{
    visible: boolean;
    type: 'avertissement' | 'info' | 'confirmation';
    titre: string;
    message: string;
  }>({visible: false, type: 'info', titre: '', message: ''});

  const gererRetour = () => {
    if (typeof navigation?.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (typeof navigation?.popToTop === 'function') {
      navigation.popToTop();
      return;
    }

    const parent = typeof navigation?.getParent === 'function' ? navigation.getParent() : null;
    if (parent && typeof parent?.canGoBack === 'function' && parent.canGoBack()) {
      parent.goBack();
    }
  };

  useEffect(() => {
    const lireBooleen = async (cle: string, defaut: boolean): Promise<boolean> => {
      const valeur = await AsyncStorage.getItem(cle);
      if (valeur === null) {
        return defaut;
      }
      return valeur === 'true';
    };

    const chargerPreferences = async () => {
      try {
        const [
          profilPublicCharge,
          partagerStatsCharge,
          notifsActivesCharge,
          notifsActivitesCharge,
        ] = await Promise.all([
          lireBooleen('profil_public', true),
          lireBooleen('partager_stats', true),
          lireBooleen('notifs_actives', true),
          lireBooleen('notifs_activites', true),
        ]);

        setProfilPublic(profilPublicCharge);
        setPartagerStats(partagerStatsCharge);
        setNotifsActives(notifsActivesCharge);
        setNotifsActivites(notifsActivitesCharge);
      } catch {
        // Si AsyncStorage échoue, on conserve les valeurs par défaut (true)
      }
    };

    void chargerPreferences();
  }, []);

  const definirPreference = async (
    cle: string,
    valeur: boolean,
    mettreAJour: (val: boolean) => void,
  ) => {
    mettreAJour(valeur);
    try {
      await AsyncStorage.setItem(cle, valeur ? 'true' : 'false');
    } catch {
      // Ignorer : l'UI reste réactive même si la persistance échoue
    }
  };

  const afficherAlerte = (
    type: 'avertissement' | 'info' | 'confirmation',
    titre: string,
    message: string,
  ) => setAlerte({visible: true, type, titre, message});

  const fermerAlerte = () => setAlerte(etat => ({...etat, visible: false}));

  const emailUtilisateur = auth().currentUser?.email ?? '';

  const gererReinitialisationMotDePasse = async () => {
    if (!emailUtilisateur) {
      afficherAlerte(
        'avertissement',
        'Aucun courriel',
        "Impossible d'envoyer un courriel de réinitialisation pour l'instant.",
      );
      return;
    }

    try {
      await auth().sendPasswordResetEmail(emailUtilisateur);
      afficherAlerte(
        'info',
        'Courriel envoyé',
        `Un lien de réinitialisation a été envoyé à ${emailUtilisateur}.`,
      );
    } catch {
      afficherAlerte(
        'avertissement',
        'Erreur',
        "Impossible d'envoyer le courriel de réinitialisation.",
      );
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <View style={styles.entete}>
          <TouchableOpacity onPress={gererRetour}>
            <Text style={styles.boutonRetour}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.titre}>Paramètres</Text>
        </View>

        <ScrollView style={styles.scroll}>
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.enteteSection}
              onPress={() => setSectionMonCompteOuverte(o => !o)}>
              <Text style={styles.titreSection}>Mon compte</Text>
              <Text style={styles.fleche}>
                {sectionMonCompteOuverte ? '˄' : '˅'}
              </Text>
            </TouchableOpacity>

            {sectionMonCompteOuverte ? (
              <View style={styles.contenuSection}>
                <View style={styles.ligneInfo}>
                  <Text style={styles.libelleInfo}>Courriel</Text>
                  <Text style={styles.valeurInfo}>
                    {emailUtilisateur || '—'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.boutonAction}
                  onPress={gererReinitialisationMotDePasse}>
                  <Text style={styles.texteBoutonAction}>
                    Réinitialiser le mot de passe
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.enteteSection}
              onPress={() => setSectionConfidentialiteOuverte(o => !o)}>
              <Text style={styles.titreSection}>Confidentialité</Text>
              <Text style={styles.fleche}>
                {sectionConfidentialiteOuverte ? '˄' : '˅'}
              </Text>
            </TouchableOpacity>

            {sectionConfidentialiteOuverte ? (
              <View style={styles.contenuSection}>
                <View style={styles.ligneSwitch}>
                  <Text style={styles.texteItem}>Profil public</Text>
                  <Switch
                    value={profilPublic}
                    onValueChange={val =>
                      void definirPreference('profil_public', val, setProfilPublic)
                    }
                    trackColor={{
                      false: 'rgba(253, 226, 255, 0.25)',
                      true: theme.couleurs.violetAccent,
                    }}
                    thumbColor={theme.couleurs.primaire}
                  />
                </View>

                <View style={styles.ligneSwitch}>
                  <Text style={styles.texteItem}>Partager mes statistiques</Text>
                  <Switch
                    value={partagerStats}
                    onValueChange={val =>
                      void definirPreference('partager_stats', val, setPartagerStats)
                    }
                    trackColor={{
                      false: 'rgba(253, 226, 255, 0.25)',
                      true: theme.couleurs.violetAccent,
                    }}
                    thumbColor={theme.couleurs.primaire}
                  />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.enteteSection}
              onPress={() => setSectionNotificationsOuverte(o => !o)}>
              <Text style={styles.titreSection}>Notifications</Text>
              <Text style={styles.fleche}>
                {sectionNotificationsOuverte ? '˄' : '˅'}
              </Text>
            </TouchableOpacity>

            {sectionNotificationsOuverte ? (
              <View style={styles.contenuSection}>
                <View style={styles.ligneSwitch}>
                  <Text style={styles.texteItem}>Activer les notifications</Text>
                  <Switch
                    value={notifsActives}
                    onValueChange={val =>
                      void definirPreference('notifs_actives', val, setNotifsActives)
                    }
                    trackColor={{
                      false: 'rgba(253, 226, 255, 0.25)',
                      true: theme.couleurs.violetAccent,
                    }}
                    thumbColor={theme.couleurs.primaire}
                  />
                </View>

                <View style={[styles.ligneSwitch, !notifsActives && styles.ligneSwitchDesactive]}>
                  <Text style={styles.texteItem}>Notifications d'activités</Text>
                  <Switch
                    value={notifsActivites}
                    onValueChange={val =>
                      void definirPreference(
                        'notifs_activites',
                        val,
                        setNotifsActivites,
                      )
                    }
                    disabled={!notifsActives}
                    trackColor={{
                      false: 'rgba(253, 226, 255, 0.25)',
                      true: theme.couleurs.violetAccent,
                    }}
                    thumbColor={theme.couleurs.primaire}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <AlertePersonnalisee
        visible={alerte.visible}
        type={alerte.type}
        titre={alerte.titre}
        message={alerte.message}
        texteConfirmer="OK"
        onConfirmer={fermerAlerte}
        onAnnuler={fermerAlerte}
      />
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
  enteteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titreSection: {
    fontFamily: theme.polices.moyenne,
    fontSize: 18,
    color: 'rgba(253, 226, 255, 0.7)',
  },
  contenuSection: {
    gap: 8,
  },
  ligneSwitch: {
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
  ligneSwitchDesactive: {
    opacity: 0.6,
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
  ligneInfo: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.2)',
  },
  libelleInfo: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: 'rgba(253, 226, 255, 0.7)',
    marginBottom: 6,
  },
  valeurInfo: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.primaire,
  },
  boutonAction: {
    backgroundColor: theme.couleurs.boutonPrimaire,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texteBoutonAction: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.texteBoutonPrimaire,
  },
});
