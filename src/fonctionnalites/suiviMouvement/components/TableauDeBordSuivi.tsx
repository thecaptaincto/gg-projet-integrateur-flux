import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {theme} from '../../../styles/theme';
import type {EtatSuivi} from '../sensors/types';
import {MiniCarteTrace} from './MiniCarteTrace';
import {
  formaterDistance,
  formaterDistanceKmMi,
  formaterVitesseKmhMph,
  formaterAllureUnite,
  type UniteSysteme,
} from '../utils/calculations';

interface ProprietesTableauDeBordSuivi {
  etat: EtatSuivi;
  estActif: boolean;
  onDemarrer?: () => void;
  onArreter?: () => void;
  onPauseReprendre?: () => void;
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
    vitesseLissee,
    vitesseLisseeKmh,
    allureSecParKm,
    nombrePasSession,
    accelerometre,
    numeroTrame,
    erreurs,
    estEnPause,
    dureeSecondes,
    distanceMetres,
    denivelePositifMetres,
    deniveleNegatifMetres,
    traceParcours,
  } = etat;

  const [unite, setUnite] = useState<UniteSysteme>('metrique');
  const {width} = useWindowDimensions();
  const basculerUnite = () => {
    setUnite(prev => (prev === 'metrique' ? 'imperial' : 'metrique'));
  };
  const vitesseAfficheeMs = vitesseLissee ?? vitesseMs;
  const vitesseAfficheeKmh = vitesseLisseeKmh ?? vitesseKmh;
  const estTablette = width >= 768;
  const largeurCarte = estTablette ? '31%' : '48%';
  const largeurPleine = estTablette ? '100%' : undefined;
  const alignementEntete = estTablette ? styles.enteteCentre : null;
  const alignementBadgeRow = estTablette ? styles.badgeRowCentre : null;

  return (
    <View style={styles.conteneur}>
      <View style={[styles.entete, alignementEntete]}>
        <Text style={styles.titre}>Suivi Mouvement</Text>
        <Pressable style={styles.toggleUnite} onPress={basculerUnite}>
          <Text style={styles.toggleUniteTexte}>
            {unite === 'metrique' ? 'Métrique (km)' : 'Impérial (mi)'}
          </Text>
        </Pressable>
        <View style={[styles.badgeRow, alignementBadgeRow]}>
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
          {(() => {
            const {valeur, unite: u} = formaterDistance(distanceMetres, unite);
            return <Text style={styles.chronoDistance}>{valeur} {u}</Text>;
          })()}
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
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="Latitude"
              valeur={latitude.toFixed(6)}
              couleur={theme.couleurs.violetAccent}
            />
          </View>
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="Longitude"
              valeur={longitude.toFixed(6)}
              couleur={theme.couleurs.violetAccent}
            />
          </View>
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="Altitude"
              valeur={altitude !== null ? altitude.toFixed(1) : 'N/D'}
              unite="m"
              couleur={theme.couleurs.violetAccent}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.nonDispo}>Non disponible</Text>
      )}

      <Text style={styles.sectionTitre}>Vitesse</Text>
      <View style={styles.grille}>
        <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
          <CarteMetrique
            titre="Vitesse"
            valeur={vitesseAfficheeMs !== null ? vitesseAfficheeMs.toFixed(2) : '--'}
            unite="m/s"
            couleur={theme.couleurs.erreur}
          />
        </View>
        {(() => {
          const {valeur, unite: u} = formaterVitesseKmhMph(
            vitesseAfficheeKmh,
            unite,
          );
          return (
            <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
              <CarteMetrique
                titre="Vitesse"
                valeur={valeur}
                unite={u}
                couleur={theme.couleurs.erreur}
              />
            </View>
          );
        })()}
      </View>

      <Text style={styles.sectionTitre}>Allure</Text>
      {(() => {
        const {valeur, unite: u} = formaterAllureUnite(allureSecParKm, unite);
        return (
          <View style={[styles.carteColonne, {flexBasis: largeurPleine ?? largeurCarte}]}>
            <CarteMetrique
              titre="Allure courante"
              valeur={valeur}
              unite={u}
              couleur={theme.couleurs.primaire}
            />
          </View>
        );
      })()}

      <Text style={styles.sectionTitre}>Distance</Text>
      {(() => {
        const {valeur, unite: u} = formaterDistanceKmMi(distanceMetres, unite);
        return (
          <View style={[styles.carteColonne, {flexBasis: largeurPleine ?? largeurCarte}]}>
            <CarteMetrique
              titre="Distance parcourue"
              valeur={valeur}
              unite={u}
              couleur={theme.couleurs.violetAccent}
            />
          </View>
        );
      })()}

      <Text style={styles.sectionTitre}>Dénivelé</Text>
      <View style={styles.grille}>
        <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
          <CarteMetrique
            titre="Positif"
            valeur={Math.round(denivelePositifMetres).toString()}
            unite="m"
            couleur="#34d399"
          />
        </View>
        <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
          <CarteMetrique
            titre="Négatif"
            valeur={Math.round(deniveleNegatifMetres).toString()}
            unite="m"
            couleur={theme.couleurs.erreur}
          />
        </View>
      </View>

      <Text style={styles.sectionTitre}>Carte et trajectoire</Text>
      <MiniCarteTrace points={traceParcours} />

      <Text style={styles.sectionTitre}>Podomètre</Text>
      <View style={[styles.carteColonne, {flexBasis: largeurPleine ?? largeurCarte}]}>
        <CarteMetrique
          titre="Pas cette session"
          valeur={nombrePasSession !== null ? `${nombrePasSession}` : '--'}
          unite="pas"
          couleur={theme.couleurs.violetAccent}
        />
      </View>

      <Text style={styles.sectionTitre}>Accéléromètre</Text>
      {accelerometre ? (
        <View style={styles.grille}>
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="X"
              valeur={accelerometre.x.toFixed(3)}
              couleur={theme.couleurs.primaire}
            />
          </View>
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="Y"
              valeur={accelerometre.y.toFixed(3)}
              couleur={theme.couleurs.primaire}
            />
          </View>
          <View style={[styles.carteColonne, {flexBasis: largeurCarte}]}>
            <CarteMetrique
              titre="Z"
              valeur={accelerometre.z.toFixed(3)}
              couleur={theme.couleurs.primaire}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.nonDispo}>Non disponible</Text>
      )}

      {/* Boutons de contrôle */}
      {!estActif && onDemarrer ? (
        <Pressable
          style={[styles.bouton, {backgroundColor: theme.couleurs.boutonPrimaire}]}
          onPress={onDemarrer}>
          <Text style={styles.boutonTexte}>Démarrer le suivi</Text>
        </Pressable>
      ) : estActif && onPauseReprendre && onArreter ? (
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: theme.espacement.md,
    paddingTop: theme.espacement.md,
    paddingBottom: theme.espacement.xl,
  },
  entete: {
    marginBottom: theme.espacement.md,
  },
  enteteCentre: {
    alignItems: 'center',
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
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRowCentre: {
    justifyContent: 'center',
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
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.espacement.xs,
  },
  carteColonne: {
    flexGrow: 1,
  },
  carte: {
    width: '100%',
    minWidth: 100,
    minHeight: 112,
    backgroundColor: theme.couleurs.champFond,
    borderRadius: theme.rayonBordure.sm,
    padding: theme.espacement.sm,
    borderLeftWidth: 3,
    borderColor: theme.couleurs.bordureTransparente,
    justifyContent: 'center',
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
    opacity: 0.75,
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
    width: '100%',
  },
  bouton: {
    marginTop: theme.espacement.lg,
    width: '100%',
    paddingVertical: theme.espacement.md,
    borderRadius: theme.rayonBordure.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
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
  toggleUnite: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.couleurs.champFond,
    borderRadius: theme.rayonBordure.sm,
    borderWidth: 1,
    borderColor: theme.couleurs.bordureTransparente,
    marginTop: 8,
    marginBottom: 4,
  },
  toggleUniteTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texte,
    fontSize: 13,
  },
});
