import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../../styles/theme';
import type {EtatSuivi} from '../sensors/types';

interface ProprietesTableauDeBordSuivi {
  etat: EtatSuivi;
  estActif: boolean;
  onDemarrer: () => void;
  onArreter: () => void;
  onPauseReprendre: () => void;
  modeSimulation: boolean;
}

function formaterDuree(totalSecondes: number): string {
  const h = Math.floor(totalSecondes / 3600);
  const m = Math.floor((totalSecondes % 3600) / 60);
  const s = totalSecondes % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CarteMetrique({
  titre,
  valeur,
  unite,
  couleur = theme.couleurs.violetAccent,
}: {
  titre: string;
  valeur: string;
  unite?: string;
  couleur?: string;
}) {
  return (
    <View style={[styles.carte, {borderLeftColor: couleur}]}>
      <Text style={styles.carteTitre}>{titre}</Text>
      <View style={styles.carteValeurRow}>
        <Text style={styles.carteValeur}>{valeur}</Text>
        {unite ? <Text style={styles.carteUnite}>{unite}</Text> : null}
      </View>
    </View>
  );
}

export function TableauDeBordSuivi({
  etat,
  estActif,
  onDemarrer,
  onArreter,
  onPauseReprendre,
  modeSimulation,
}: ProprietesTableauDeBordSuivi) {
  const {
    latitude,
    longitude,
    altitude,
    vitesseMs,
    vitesseKmh,
    nombrePasSession,
    accelerometre,
    numeroTrame,
    erreurs,
    estEnPause,
    dureeSecondes,
    distanceMetres,
  } = etat;

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Suivi Mouvement</Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: estActif
                  ? estEnPause
                    ? theme.couleurs.champBordure
                    : theme.couleurs.violetAccent
                  : 'rgba(253,226,255,0.2)',
              },
            ]}>
            <Text style={styles.badgeTexte}>
              {estActif ? (estEnPause ? 'EN PAUSE' : 'ACTIF') : 'ARRÊTÉ'}
            </Text>
          </View>
          {modeSimulation ? (
            <View style={[styles.badge, {backgroundColor: theme.couleurs.champBordure}]}>
              <Text style={styles.badgeTexte}>SIMULATION</Text>
            </View>
          ) : null}
          {estActif ? (
            <Text style={styles.trameTexte}>Trame #{numeroTrame}</Text>
          ) : null}
        </View>
      </View>

      {/* Chronomètre session */}
      {estActif ? (
        <View style={styles.chronoBox}>
          <Text style={styles.chronoValeur}>{formaterDuree(dureeSecondes)}</Text>
          <Text style={styles.chronoLibelle}>durée</Text>
          <Text style={styles.chronoDistance}>
            {distanceMetres >= 1000
              ? `${(distanceMetres / 1000).toFixed(2)} km`
              : `${Math.round(distanceMetres)} m`}
          </Text>
        </View>
      ) : null}

      {erreurs.length > 0 ? (
        <View style={styles.erreursBox}>
          {erreurs.map((err, i) => (
            <Text key={i} style={styles.erreurTexte}>
              ! {err}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitre}>Position GPS</Text>
      {latitude !== null && longitude !== null ? (
        <View style={styles.grille}>
          <CarteMetrique
            titre="Latitude"
            valeur={latitude.toFixed(6)}
            couleur={theme.couleurs.violetAccent}
          />
          <CarteMetrique
            titre="Longitude"
            valeur={longitude.toFixed(6)}
            couleur={theme.couleurs.violetAccent}
          />
          <CarteMetrique
            titre="Altitude"
            valeur={altitude !== null ? altitude.toFixed(1) : 'N/D'}
            unite="m"
            couleur={theme.couleurs.violetAccent}
          />
        </View>
      ) : (
        <Text style={styles.nonDispo}>Non disponible</Text>
      )}

      <Text style={styles.sectionTitre}>Vitesse</Text>
      <View style={styles.grille}>
        <CarteMetrique
          titre="Vitesse"
          valeur={vitesseMs !== null ? vitesseMs.toFixed(2) : '--'}
          unite="m/s"
          couleur={theme.couleurs.erreur}
        />
        <CarteMetrique
          titre="Vitesse"
          valeur={vitesseKmh !== null ? vitesseKmh.toFixed(1) : '--'}
          unite="km/h"
          couleur={theme.couleurs.erreur}
        />
      </View>

      <Text style={styles.sectionTitre}>Podomètre</Text>
      <CarteMetrique
        titre="Pas cette session"
        valeur={nombrePasSession !== null ? `${nombrePasSession}` : '--'}
        unite="pas"
        couleur={theme.couleurs.violetAccent}
      />

      <Text style={styles.sectionTitre}>Accéléromètre</Text>
      {accelerometre ? (
        <View style={styles.grille}>
          <CarteMetrique
            titre="X"
            valeur={accelerometre.x.toFixed(3)}
            couleur={theme.couleurs.primaire}
          />
          <CarteMetrique
            titre="Y"
            valeur={accelerometre.y.toFixed(3)}
            couleur={theme.couleurs.primaire}
          />
          <CarteMetrique
            titre="Z"
            valeur={accelerometre.z.toFixed(3)}
            couleur={theme.couleurs.primaire}
          />
        </View>
      ) : (
        <Text style={styles.nonDispo}>Non disponible</Text>
      )}

      {/* Boutons de contrôle */}
      {!estActif ? (
        <Pressable
          style={[styles.bouton, {backgroundColor: theme.couleurs.boutonPrimaire}]}
          onPress={onDemarrer}>
          <Text style={styles.boutonTexte}>Démarrer le suivi</Text>
        </Pressable>
      ) : (
        <View style={styles.boutonsActifs}>
          <Pressable
            style={[styles.bouton, styles.boutonDemi, {backgroundColor: theme.couleurs.champFond, borderWidth: 2, borderColor: theme.couleurs.bordureTransparente}]}
            onPress={onPauseReprendre}>
            <Text style={[styles.boutonTexte, {color: theme.couleurs.texte}]}>
              {estEnPause ? 'Reprendre' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.bouton, styles.boutonDemi, {backgroundColor: theme.couleurs.erreur}]}
            onPress={onArreter}>
            <Text style={styles.boutonTexte}>Arrêter</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: theme.espacement.md,
  },
  entete: {
    marginBottom: theme.espacement.md,
  },
  titre: {
    fontSize: 28,
    fontFamily: theme.polices.grasse,
    color: theme.couleurs.texte,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.rayonBordure.sm,
  },
  badgeTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  trameTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteSecondaire,
    fontSize: 12,
    marginLeft: 4,
  },
  chronoBox: {
    alignItems: 'center',
    backgroundColor: theme.couleurs.champFond,
    borderRadius: theme.rayonBordure.md,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureTransparente,
    paddingVertical: theme.espacement.lg,
    marginBottom: theme.espacement.md,
  },
  chronoValeur: {
    fontFamily: theme.polices.grasse,
    fontSize: 52,
    color: theme.couleurs.texte,
    letterSpacing: 2,
  },
  chronoLibelle: {
    fontFamily: theme.polices.reguliere,
    fontSize: 12,
    color: theme.couleurs.texteSecondaire,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  chronoDistance: {
    fontFamily: theme.polices.reguliere,
    fontSize: 18,
    color: theme.couleurs.primaire,
    marginTop: theme.espacement.xs,
  },
  sectionTitre: {
    fontSize: 13,
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteSecondaire,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.espacement.md,
    marginBottom: theme.espacement.xs,
  },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.espacement.xs,
  },
  carte: {
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.couleurs.champFond,
    borderRadius: theme.rayonBordure.sm,
    padding: theme.espacement.sm,
    borderLeftWidth: 3,
    borderColor: theme.couleurs.bordureTransparente,
  },
  carteTitre: {
    fontSize: 11,
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteSecondaire,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  carteValeurRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  carteValeur: {
    fontSize: 22,
    fontFamily: theme.polices.grasse,
    color: theme.couleurs.texte,
    fontVariant: ['tabular-nums'],
  },
  carteUnite: {
    fontSize: 12,
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteSecondaire,
  },
  nonDispo: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.placeholder,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  erreursBox: {
    backgroundColor: theme.couleurs.alerteAvertissementDebut,
    borderRadius: theme.rayonBordure.sm,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.couleurs.erreur,
  },
  erreurTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.erreur,
    fontSize: 12,
    marginBottom: 2,
  },
  boutonsActifs: {
    flexDirection: 'row',
    gap: theme.espacement.sm,
    marginTop: theme.espacement.lg,
  },
  bouton: {
    marginTop: theme.espacement.lg,
    paddingVertical: theme.espacement.md,
    borderRadius: theme.rayonBordure.md,
    alignItems: 'center',
  },
  boutonDemi: {
    flex: 1,
    marginTop: 0,
  },
  boutonTexte: {
    fontFamily: theme.polices.grasse,
    color: theme.couleurs.texteBoutonPrimaire,
    fontSize: 16,
  },
});
