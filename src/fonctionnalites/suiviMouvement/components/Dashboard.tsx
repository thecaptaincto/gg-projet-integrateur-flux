// ============================================================
// Dashboard.tsx — Affichage temps reel des capteurs
// Porté depuis le projet Expo de ton ami (sans Expo Router).
// ============================================================

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {EtatSuivi} from '../sensors/types';

interface PropsDashboard {
  etat: EtatSuivi;
  estActif: boolean;
  onDemarrer: () => void;
  onArreter: () => void;
  modeSimulation: boolean;
}

function CarteMetrique({
  titre,
  valeur,
  unite,
  couleur = '#4ECDC4',
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

export function Dashboard({
  etat,
  estActif,
  onDemarrer,
  onArreter,
  modeSimulation,
}: PropsDashboard) {
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
  } = etat;

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Suivi Mouvement</Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              {backgroundColor: estActif ? '#2ECC71' : '#95A5A6'},
            ]}>
            <Text style={styles.badgeTexte}>
              {estActif ? 'ACTIF' : 'ARRÊTÉ'}
            </Text>
          </View>
          {modeSimulation ? (
            <View style={[styles.badge, {backgroundColor: '#F39C12'}]}>
              <Text style={styles.badgeTexte}>SIMULATION</Text>
            </View>
          ) : null}
          {estActif ? (
            <Text style={styles.trameTexte}>Trame #{numeroTrame}</Text>
          ) : null}
        </View>
      </View>

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
            couleur="#3498DB"
          />
          <CarteMetrique
            titre="Longitude"
            valeur={longitude.toFixed(6)}
            couleur="#3498DB"
          />
          <CarteMetrique
            titre="Altitude"
            valeur={altitude !== null ? altitude.toFixed(1) : 'N/A'}
            unite="m"
            couleur="#3498DB"
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
          couleur="#E74C3C"
        />
        <CarteMetrique
          titre="Vitesse"
          valeur={vitesseKmh !== null ? vitesseKmh.toFixed(1) : '--'}
          unite="km/h"
          couleur="#E74C3C"
        />
      </View>

      <Text style={styles.sectionTitre}>Podomètre</Text>
      <CarteMetrique
        titre="Pas cette session"
        valeur={nombrePasSession !== null ? `${nombrePasSession}` : '--'}
        unite="pas"
        couleur="#9B59B6"
      />

      <Text style={styles.sectionTitre}>Accéléromètre</Text>
      {accelerometre ? (
        <View style={styles.grille}>
          <CarteMetrique
            titre="X"
            valeur={accelerometre.x.toFixed(3)}
            couleur="#F39C12"
          />
          <CarteMetrique
            titre="Y"
            valeur={accelerometre.y.toFixed(3)}
            couleur="#F39C12"
          />
          <CarteMetrique
            titre="Z"
            valeur={accelerometre.z.toFixed(3)}
            couleur="#F39C12"
          />
        </View>
      ) : (
        <Text style={styles.nonDispo}>Non disponible</Text>
      )}

      <Pressable
        style={[
          styles.bouton,
          {backgroundColor: estActif ? '#E74C3C' : '#2ECC71'},
        ]}
        onPress={estActif ? onArreter : onDemarrer}>
        <Text style={styles.boutonTexte}>
          {estActif ? 'Arrêter le suivi' : 'Démarrer le suivi'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1A1A2E',
  },
  entete: {
    marginBottom: 16,
  },
  titre: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EAEAEA',
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
    borderRadius: 12,
  },
  badgeTexte: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trameTexte: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  sectionTitre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  carte: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#16213E',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  carteTitre: {
    fontSize: 11,
    color: '#888',
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
    fontWeight: '700',
    color: '#EAEAEA',
    fontVariant: ['tabular-nums'],
  },
  carteUnite: {
    fontSize: 12,
    color: '#666',
  },
  nonDispo: {
    color: '#555',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  erreursBox: {
    backgroundColor: '#2C1810',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  erreurTexte: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 2,
  },
  bouton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  boutonTexte: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
