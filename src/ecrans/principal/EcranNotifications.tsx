import React, {useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  AlertePersonnalisee,
  type TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {utiliserNotifications} from '../../contextes/ContexteNotifications';
import {theme} from '../../styles/theme';

const formaterTempsRelatif = (dateISO: string) => {
  const date = new Date(dateISO);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHeures = Math.floor(diffMinutes / 60);
  if (diffHeures < 24) {
    return `Il y a ${diffHeures} h`;
  }

  const diffJours = Math.floor(diffHeures / 24);
  return `Il y a ${diffJours} j`;
};

export const EcranNotifications = () => {
  const {
    notifications,
    notificationsActivees,
    permissionAccordee,
    chargement,
    nombreNonLues,
    marquerCommeLue,
    marquerToutesCommeLues,
    viderNotifications,
    ajouterNotificationSysteme,
  } = utiliserNotifications();

  const [alerte, setAlerte] = useState<{
    visible: boolean;
    type: TypeAlertePersonnalisee;
    titre: string;
    message: string;
  }>({visible: false, type: 'info', titre: '', message: ''});

  const sousTitre = useMemo(() => {
    if (!notificationsActivees) {
      return 'Les notifications sont désactivées dans tes paramètres.';
    }

    if (!permissionAccordee) {
      return "Les notifications sont prêtes côté app, mais l'autorisation système n'a pas encore été accordée.";
    }

    if (chargement) {
      return 'Chargement de tes notifications...';
    }

    if (nombreNonLues > 0) {
      return `${nombreNonLues} notification${nombreNonLues > 1 ? 's' : ''} non lue${nombreNonLues > 1 ? 's' : ''}`;
    }

    return 'Tout est à jour.';
  }, [chargement, nombreNonLues, notificationsActivees, permissionAccordee]);

  const ouvrirConfirmationVidage = () => {
    setAlerte({
      visible: true,
      type: 'confirmation',
      titre: 'Effacer les notifications',
      message: 'Cette action supprimera toute la boîte de notifications.',
    });
  };

  const fermerAlerte = () => setAlerte(etat => ({...etat, visible: false}));

  const confirmerVidage = async () => {
    await viderNotifications();
    fermerAlerte();
  };

  const creerNotificationTest = async () => {
    await ajouterNotificationSysteme(
      'Notification de test',
      'Flux est prêt pour la démo: cette alerte a été générée localement dans l’application.',
      {type: 'test-local'},
    );
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur}>
        <ScrollView contentContainerStyle={styles.contenuScroll}>
          <View style={styles.entete}>
            <Text style={styles.titre}>NOTIFICATIONS</Text>
            <Text style={styles.sousTitre}>{sousTitre}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.boutonAction,
                nombreNonLues === 0 && styles.boutonActionDesactive,
              ]}
              disabled={nombreNonLues === 0}
              onPress={() => void marquerToutesCommeLues()}>
              <Text style={styles.texteBoutonAction}>Tout marquer lu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boutonActionSecondaire}
              disabled={!notificationsActivees}
              onPress={() => void creerNotificationTest()}>
              <Text style={styles.texteBoutonActionSecondaire}>Créer un test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.boutonActionSecondaire,
                notifications.length === 0 && styles.boutonActionDesactive,
              ]}
              disabled={notifications.length === 0}
              onPress={ouvrirConfirmationVidage}>
              <Text style={styles.texteBoutonActionSecondaire}>Vider</Text>
            </TouchableOpacity>
          </View>

          {!notificationsActivees ? (
            <View style={styles.carteEtat}>
              <Text style={styles.titreEtat}>Notifications désactivées</Text>
              <Text style={styles.texteEtat}>
                Active-les depuis Paramètres pour recevoir les prochaines alertes
                de l’application dans Flux.
              </Text>
            </View>
          ) : null}

          {notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.9}
              style={[
                styles.carteNotification,
                notification.lue && styles.carteNotificationLue,
              ]}
              onPress={() => void marquerCommeLue(notification.id)}>
              <View
                style={[
                  styles.badge,
                  notification.lue ? styles.badgeLu : null,
                ]}
              />
              <View style={styles.contenuNotification}>
                <View style={styles.ligneTitre}>
                  <Text style={styles.titreNotification}>
                    {notification.titre}
                  </Text>
                  {!notification.lue ? (
                    <Text style={styles.pastilleNouveau}>Nouveau</Text>
                  ) : null}
                </View>
                <Text style={styles.texteNotification}>
                  {notification.message}
                </Text>
                <Text style={styles.sourceNotification}>
                  {notification.source === 'push'
                    ? 'Source : notification système'
                    : 'Source : application'}
                </Text>
                <Text style={styles.heureNotification}>
                  {formaterTempsRelatif(notification.dateISO)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {!chargement && notifications.length === 0 ? (
            <View style={styles.etatVide}>
              <Text style={styles.titreEtat}>Aucune notification</Text>
              <Text style={styles.texteEtat}>
                Les nouvelles alertes reçues apparaîtront ici.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <AlertePersonnalisee
        visible={alerte.visible}
        type={alerte.type}
        titre={alerte.titre}
        message={alerte.message}
        texteConfirmer="Supprimer"
        onAnnuler={fermerAlerte}
        onConfirmer={() => void confirmerVidage()}
      />
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
  entete: {
    marginBottom: theme.espacement.lg,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 42,
    color: theme.couleurs.texte,
  },
  sousTitre: {
    marginTop: 8,
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: 'rgba(253, 226, 255, 0.8)',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.espacement.lg,
  },
  boutonAction: {
    flex: 1,
    backgroundColor: theme.couleurs.boutonPrimaire,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  boutonActionSecondaire: {
    minWidth: 96,
    backgroundColor: 'rgba(253, 226, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  boutonActionDesactive: {
    opacity: 0.45,
  },
  texteBoutonAction: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  texteBoutonActionSecondaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  carteNotification: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253, 226, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.24)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.md,
    marginBottom: theme.espacement.md,
  },
  carteNotificationLue: {
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff7a99',
    marginRight: theme.espacement.md,
    marginTop: 6,
  },
  badgeLu: {
    backgroundColor: 'rgba(253, 226, 255, 0.35)',
  },
  contenuNotification: {
    flex: 1,
  },
  ligneTitre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  titreNotification: {
    flex: 1,
    fontFamily: theme.polices.reguliere,
    fontSize: 20,
    color: theme.couleurs.texte,
  },
  pastilleNouveau: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: '#2a0134',
    backgroundColor: '#ffb3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  texteNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteClair,
    marginBottom: 6,
    lineHeight: 22,
  },
  sourceNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: 'rgba(253, 226, 255, 0.65)',
    marginBottom: 4,
  },
  heureNotification: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: 'rgba(253, 226, 255, 0.6)',
  },
  carteEtat: {
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 255, 0.2)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    marginBottom: theme.espacement.md,
  },
  etatVide: {
    alignItems: 'center',
    marginTop: theme.espacement.xl,
    paddingHorizontal: theme.espacement.lg,
  },
  titreEtat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texte,
    marginBottom: 8,
    textAlign: 'center',
  },
  texteEtat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: 'rgba(253, 226, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
