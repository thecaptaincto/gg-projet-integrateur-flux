import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {theme} from '../../styles/theme';

// Simulation de capteur — à remplacer plus tard par données Bluetooth/WiFi réelles
const obtenirVitesseSimulee = (): number => {
  return Math.random() * 30 + 5; // entre 5 et 35 km/h
};

const formaterChronometre = (totalSecondes: number): string => {
  const minutes = Math.floor(totalSecondes / 60);
  const secondes = totalSecondes % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
};

// Écran de session d'activité (style Strava).
// `edges` exclut le bord inférieur pour que la barre d'onglets soit adjacente au contenu.
export const EcranEnregistrer = () => {
  const [enCours, setEnCours] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [vitesseActuelle, setVitesseActuelle] = useState(0);
  const [vitesseMax, setVitesseMax] = useState(0);
  const [distanceTotale, setDistanceTotale] = useState(0);

  useEffect(() => {
    if (!enCours) {
      return;
    }

    const intervalId = setInterval(() => {
      const nouvelleVitesse = obtenirVitesseSimulee();
      setVitesseActuelle(nouvelleVitesse);
      setVitesseMax(max => Math.max(max, nouvelleVitesse));
      setSecondes(s => s + 1);
      // distance (km) = vitesse (km/h) × temps (h)
      setDistanceTotale(d => d + nouvelleVitesse / 3600);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [enCours]);

  const vitesseMoyenne = useMemo(() => {
    if (secondes <= 0) {
      return 0;
    }
    const heures = secondes / 3600;
    return distanceTotale / heures;
  }, [distanceTotale, secondes]);

  const gererDemarrer = () => {
    setSecondes(0);
    setVitesseActuelle(0);
    setVitesseMax(0);
    setDistanceTotale(0);
    setEnCours(true);
  };

  const gererArreter = () => {
    setEnCours(false);
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.contenu}>
          <Text style={styles.titre}>SESSION</Text>

          <View style={styles.conteneurVitesse}>
            <Text style={styles.vitesse}>
              {vitesseActuelle.toFixed(1)} km/h
            </Text>
            <Text style={styles.sousTexte}>
              {enCours ? 'Vitesse actuelle' : 'Appuyez sur Démarrer'}
            </Text>
          </View>

          <View style={styles.ligneStats}>
            <View style={styles.carteStat}>
              <Text style={styles.valeurStat}>{formaterChronometre(secondes)}</Text>
              <Text style={styles.libelleStat}>Temps</Text>
            </View>
            <View style={styles.carteStat}>
              <Text style={styles.valeurStat}>{distanceTotale.toFixed(2)} km</Text>
              <Text style={styles.libelleStat}>Distance</Text>
            </View>
          </View>

          {!enCours && secondes > 0 ? (
            <View style={styles.carteResume}>
              <Text style={styles.titreResume}>Résumé</Text>
              <View style={styles.ligneResume}>
                <Text style={styles.libelleResume}>Durée</Text>
                <Text style={styles.valeurResume}>
                  {formaterChronometre(secondes)}
                </Text>
              </View>
              <View style={styles.ligneResume}>
                <Text style={styles.libelleResume}>Distance</Text>
                <Text style={styles.valeurResume}>
                  {distanceTotale.toFixed(2)} km
                </Text>
              </View>
              <View style={styles.ligneResume}>
                <Text style={styles.libelleResume}>Vitesse max</Text>
                <Text style={styles.valeurResume}>
                  {vitesseMax.toFixed(1)} km/h
                </Text>
              </View>
              <View style={styles.ligneResume}>
                <Text style={styles.libelleResume}>Vitesse moyenne</Text>
                <Text style={styles.valeurResume}>
                  {vitesseMoyenne.toFixed(1)} km/h
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.ligneBoutons}>
            <TouchableOpacity
              style={[
                styles.bouton,
                styles.boutonPrimaire,
                enCours && styles.boutonDesactive,
              ]}
              onPress={gererDemarrer}
              disabled={enCours}>
              <Text style={styles.texteBoutonPrimaire}>Démarrer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bouton,
                styles.boutonSecondaire,
                !enCours && styles.boutonDesactive,
              ]}
              onPress={gererArreter}
              disabled={!enCours}>
              <Text style={styles.texteBoutonSecondaire}>Arrêter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  contenu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.espacement.lg,
    paddingTop: theme.espacement.xl,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 48,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.xl,
  },
  conteneurVitesse: {
    alignItems: 'center',
    marginBottom: theme.espacement.xl,
  },
  vitesse: {
    fontFamily: theme.polices.reguliere,
    fontSize: 56,
    color: theme.couleurs.primaire,
    letterSpacing: 0.5,
  },
  sousTexte: {
    marginTop: theme.espacement.xs,
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteSecondaire,
  },
  ligneStats: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.espacement.md,
    marginBottom: theme.espacement.xl,
  },
  carteStat: {
    flex: 1,
    backgroundColor: 'rgba(253, 226, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.3)',
    borderRadius: theme.rayonBordure.md,
    paddingVertical: theme.espacement.lg,
    paddingHorizontal: theme.espacement.md,
    alignItems: 'center',
  },
  valeurStat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 28,
    color: theme.couleurs.texte,
    marginBottom: 6,
  },
  libelleStat: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
  },
  carteResume: {
    width: '100%',
    backgroundColor: 'rgba(253, 226, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253, 226, 255, 0.25)',
    borderRadius: theme.rayonBordure.md,
    padding: theme.espacement.lg,
    marginBottom: theme.espacement.xl,
  },
  titreResume: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texte,
    marginBottom: theme.espacement.md,
  },
  ligneResume: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.espacement.sm,
  },
  libelleResume: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texteSecondaire,
  },
  valeurResume: {
    fontFamily: theme.polices.reguliere,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  ligneBoutons: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.espacement.md,
  },
  bouton: {
    flex: 1,
    minHeight: 56,
    borderRadius: theme.rayonBordure.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  boutonPrimaire: {
    backgroundColor: theme.couleurs.boutonPrimaire,
  },
  boutonSecondaire: {
    borderWidth: 2,
    borderColor: theme.couleurs.bordure,
    backgroundColor: 'transparent',
  },
  boutonDesactive: {
    opacity: 0.5,
  },
  texteBoutonPrimaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteBoutonPrimaire,
  },
  texteBoutonSecondaire: {
    fontFamily: theme.polices.reguliere,
    fontSize: 22,
    color: theme.couleurs.texteClair,
  },
});
