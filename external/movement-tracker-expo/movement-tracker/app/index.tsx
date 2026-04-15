// ============================================================
// app/index.tsx — Écran principal
// Équivalent de main() dans principe.py
// ============================================================

import React, { useState } from "react";
import { ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { useSuiviMouvement } from "../src/hooks/useSuiviMouvement";
import { Dashboard } from "../src/components/Dashboard";

export default function EcranPrincipal() {
  // Passer simulation={true} pour tester sans téléphone
  // En production, mettre false pour utiliser les vrais capteurs
  const [modeSimulation] = useState(false);

  const { etat, demarrer, arreter } = useSuiviMouvement({
    simulation: modeSimulation,
    config: {
      intervalleSondageMs: 1000,
      capteursActifs: {
        gps: true,
        podometre: true,
        accelerometre: true,
      },
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Dashboard
          etat={etat}
          estActif={etat.estActif}
          onDemarrer={demarrer}
          onArreter={arreter}
          modeSimulation={modeSimulation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
