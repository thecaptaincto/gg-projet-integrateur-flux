// MiniCarteTrace.tsx — Carte GPS inline affichant la trace du parcours en cours.
// Utilise une grille de 3×3 tuiles OpenStreetMap (projection Web Mercator / EPSG:3857).
// Le zoom est choisi automatiquement pour que 72 % du canvas contienne tous les points.
// Les segments sont dessinés en "pointillés" (Views positionnées absolument, espacées de 10 px)
// car React Native ne supporte pas nativement les <canvas> ou les SVG polyline.
// Le badge "Zoom auto limité" s'affiche quand l'étendue GPS est trop faible pour être utile.

import React, {useMemo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import type {PointTrace} from '../sensors/types';
import {theme} from '../../../styles/theme';

const TAILLE_TUILE = 256;
const GRILLE_TUILES = 3;
const TAILLE_CANVAS = TAILLE_TUILE * GRILLE_TUILES;
const TAILLE_AFFICHAGE = 320;
const ECHELLE_AFFICHAGE = TAILLE_AFFICHAGE / TAILLE_CANVAS;
const MARGE_MIN_DEGRES = 0.002;

type PointProjet = PointTrace & {x: number; y: number};

function borne(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

// Projection Mercator : convertit une longitude en coordonnée pixel X au niveau de zoom donné.
// Formule standard OSM : x = ((lon + 180) / 360) * 256 * 2^zoom
function longitudeVersPixelX(longitude: number, zoom: number): number {
  return ((longitude + 180) / 360) * TAILLE_TUILE * 2 ** zoom;
}

// Projection Mercator : convertit une latitude en coordonnée pixel Y.
// Bornée entre ±85.05° (limites de la projection) pour éviter la division par zéro.
// Formule : y = ((1 - ln(tan(π/4 + lat/2)) / π) / 2) * 256 * 2^zoom
function latitudeVersPixelY(latitude: number, zoom: number): number {
  const latitudeBornee = borne(latitude, -85.05112878, 85.05112878);
  const rad = (latitudeBornee * Math.PI) / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + rad / 2));
  return (
    ((1 - mercator / Math.PI) / 2) * TAILLE_TUILE * 2 ** zoom
  );
}

// Sélectionne le zoom OSM (11–17) le plus élevé pour lequel la trace tient
// dans 72 % du canvas (TAILLE_CANVAS × 0.72), afin de laisser une marge visuelle.
function choisirZoom(points: PointTrace[]): number {
  if (points.length <= 1) {
    return 16;
  }

  const latitudes = points.map(point => point.latitude);
  const longitudes = points.map(point => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  for (let zoom = 17; zoom >= 11; zoom--) {
    const largeur =
      longitudeVersPixelX(maxLon, zoom) - longitudeVersPixelX(minLon, zoom);
    const hauteur =
      Math.abs(latitudeVersPixelY(minLat, zoom) - latitudeVersPixelY(maxLat, zoom));
    if (
      largeur <= TAILLE_CANVAS * 0.72 &&
      hauteur <= TAILLE_CANVAS * 0.72
    ) {
      return zoom;
    }
  }

  return 11;
}

// Calcule la grille de tuiles et projette les points GPS en coordonnées pixel canvas.
// Centre la vue sur le barycentre de la trace, puis détermine les 9 tuiles OSM
// qui recouvrent le canvas. Retourne aussi etendueFaible si la trace est trop courte
// pour être significative (moins de ~200 m, soit < MARGE_MIN_DEGRES).
function preparerCarte(points: PointTrace[]) {
  if (points.length === 0) {
    return {
      pointsProjetes: [] as PointProjet[],
      tuiles: [] as {key: string; left: number; top: number; uri: string}[],
      zoom: 16,
      etendueFaible: true,
    };
  }

  const latitudes = points.map(point => point.latitude);
  const longitudes = points.map(point => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const centreLat = (minLat + maxLat) / 2;
  const centreLon = (minLon + maxLon) / 2;
  const zoom = choisirZoom(points);

  const centreX = longitudeVersPixelX(centreLon, zoom);
  const centreY = latitudeVersPixelY(centreLat, zoom);
  const origineMondeX = centreX - TAILLE_CANVAS / 2;
  const origineMondeY = centreY - TAILLE_CANVAS / 2;

  const departTuileX = Math.floor(origineMondeX / TAILLE_TUILE);
  const departTuileY = Math.floor(origineMondeY / TAILLE_TUILE);

  const tuiles = Array.from({length: GRILLE_TUILES * GRILLE_TUILES}, (_, index) => {
    const colonne = index % GRILLE_TUILES;
    const ligne = Math.floor(index / GRILLE_TUILES);
    const x = departTuileX + colonne;
    const y = departTuileY + ligne;
    return {
      key: `${zoom}-${x}-${y}`,
      left: colonne * TAILLE_TUILE,
      top: ligne * TAILLE_TUILE,
      uri: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
    };
  });

  const pointsProjetes: PointProjet[] = points.map(point => ({
    ...point,
    x: longitudeVersPixelX(point.longitude, zoom) - origineMondeX,
    y: latitudeVersPixelY(point.latitude, zoom) - origineMondeY,
  }));

  const largeurTrace = Math.max(
    ...pointsProjetes.map(point => point.x),
  ) - Math.min(...pointsProjetes.map(point => point.x));
  const hauteurTrace = Math.max(
    ...pointsProjetes.map(point => point.y),
  ) - Math.min(...pointsProjetes.map(point => point.y));

  return {
    pointsProjetes,
    tuiles,
    zoom,
    etendueFaible:
      Math.abs(maxLat - minLat) < MARGE_MIN_DEGRES &&
      Math.abs(maxLon - minLon) < MARGE_MIN_DEGRES &&
      largeurTrace < 18 &&
      hauteurTrace < 18,
  };
}

// Simule un trait entre deux points projetés en plaçant `etapes` petits points Views.
// React Native ne peut pas tracer de lignes SVG, donc on découpe le vecteur en N dots
// espacés régulièrement (max 1 dot / 10 px). Les segments < 2 px sont ignorés.
function SegmentTrace({
  depart,
  arrivee,
}: {
  depart: PointProjet;
  arrivee: PointProjet;
}) {
  const dx = arrivee.x - depart.x;
  const dy = arrivee.y - depart.y;
  const longueur = Math.sqrt(dx * dx + dy * dy);

  if (longueur < 2) {
    return null;
  }

  const etapes = Math.max(Math.ceil(longueur / 10), 1);

  return (
    <>
      {Array.from({length: etapes}, (_, index) => {
        const ratio = index / etapes;
        return (
          <View
            key={`${depart.timestamp}-${arrivee.timestamp}-${index}`}
            style={[
              styles.segmentPoint,
              {
                left: (depart.x + dx * ratio) * ECHELLE_AFFICHAGE - 2,
                top: (depart.y + dy * ratio) * ECHELLE_AFFICHAGE - 2,
              },
            ]}
          />
        );
      })}
    </>
  );
}

export function MiniCarteTrace({points}: {points: PointTrace[]}) {
  const carte = useMemo(() => preparerCarte(points), [points]);

  if (points.length === 0) {
    return (
      <View style={styles.vide}>
        <Text style={styles.videTitre}>Carte indisponible</Text>
        <Text style={styles.videTexte}>
          Commence le suivi pour voir la trajectoire.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.carte}>
      <View style={styles.plan}>
        {carte.tuiles.map(tuile => (
          <Image
            key={tuile.key}
            source={{uri: tuile.uri}}
            style={[
              styles.tuile,
              {
                left: tuile.left * ECHELLE_AFFICHAGE,
                top: tuile.top * ECHELLE_AFFICHAGE,
              },
            ]}
          />
        ))}

        <View style={styles.overlay}>
          {carte.pointsProjetes.slice(1).map((point, index) => (
            <SegmentTrace
              key={`${point.timestamp}-${index}`}
              depart={carte.pointsProjetes[index]}
              arrivee={point}
            />
          ))}

          {carte.pointsProjetes.map((point, index) => {
            const estDepart = index === 0;
            const estArrivee = index === carte.pointsProjetes.length - 1;
            return (
              <View
                key={`${point.timestamp}-${point.latitude}-${point.longitude}`}
                style={[
                  styles.point,
                  estDepart && styles.pointDepart,
                  estArrivee && styles.pointArrivee,
                  {
                    left:
                      point.x * ECHELLE_AFFICHAGE - (estDepart || estArrivee ? 6 : 4),
                    top:
                      point.y * ECHELLE_AFFICHAGE - (estDepart || estArrivee ? 6 : 4),
                  },
                ]}
              />
            );
          })}

          {carte.etendueFaible ? (
            <View style={styles.badgePrecision}>
              <Text style={styles.badgePrecisionTexte}>Zoom auto limité</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.pied}>
        <Text style={styles.piedTexte}>Trace GPS en direct</Text>
        <Text style={styles.piedTexte}>Fonds de carte OpenStreetMap</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    overflow: 'hidden',
    borderRadius: theme.rayonBordure.md,
    borderWidth: 2,
    borderColor: theme.couleurs.bordureTransparente,
    backgroundColor: '#12051a',
  },
  plan: {
    width: TAILLE_AFFICHAGE,
    height: TAILLE_AFFICHAGE,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  tuile: {
    position: 'absolute',
    width: TAILLE_TUILE * ECHELLE_AFFICHAGE,
    height: TAILLE_TUILE * ECHELLE_AFFICHAGE,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  segmentPoint: {
    position: 'absolute',
    height: 4,
    width: 4,
    borderRadius: 999,
    backgroundColor: theme.couleurs.accentRose,
    opacity: 0.92,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.couleurs.primaire,
    borderWidth: 1,
    borderColor: '#2a0134',
  },
  pointDepart: {
    width: 12,
    height: 12,
    backgroundColor: '#34d399',
  },
  pointArrivee: {
    width: 12,
    height: 12,
    backgroundColor: theme.couleurs.erreur,
  },
  badgePrecision: {
    position: 'absolute',
    right: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 0, 29, 0.72)',
  },
  badgePrecisionTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 11,
    color: theme.couleurs.texte,
  },
  pied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.espacement.sm,
    paddingVertical: theme.espacement.xs,
    backgroundColor: 'rgba(20, 0, 29, 0.92)',
  },
  piedTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 11,
    color: theme.couleurs.texteSecondaire,
  },
  vide: {
    borderRadius: theme.rayonBordure.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.couleurs.bordureTransparente,
    backgroundColor: theme.couleurs.surfaceLegere,
    paddingVertical: theme.espacement.xl,
    paddingHorizontal: theme.espacement.md,
    alignItems: 'center',
  },
  videTitre: {
    fontFamily: theme.polices.grasse,
    fontSize: 18,
    color: theme.couleurs.texte,
    marginBottom: 6,
  },
  videTexte: {
    fontFamily: theme.polices.reguliere,
    fontSize: 13,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
  },
});
