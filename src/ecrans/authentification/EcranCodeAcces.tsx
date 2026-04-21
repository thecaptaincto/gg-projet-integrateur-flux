import React, {useMemo, useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrierePlanGradient} from '../../composants/ArrierePlanGradient';
import {
  AlertePersonnalisee,
  type TypeAlertePersonnalisee,
} from '../../composants/AlertePersonnalisee';
import {utiliserAuth} from '../../contextes/ContexteAuth';
import {theme} from '../../styles/theme';

export const EcranCodeAcces = ({navigation}: {navigation: any}) => {
  const {verifierCodeAcces, seDeconnecter} = utiliserAuth();
  const [code, setCode] = useState('');
  const [chargement, setChargement] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [alerte, setAlerte] = useState({
    visible: false,
    type: 'info' as TypeAlertePersonnalisee,
    titre: '',
    message: '',
  });

  const codeNettoye = useMemo(() => code.replace(/\s/g, ''), [code]);

  const fermerAlerte = () => setAlerte(prev => ({...prev, visible: false}));

  const valider = async () => {
    if (chargement) return;
    if (codeNettoye.length < 6) {
      setAlerte({
        visible: true,
        type: 'attention' as TypeAlertePersonnalisee,
        titre: 'Attention',
        message: 'Entre ton code d’accès à 6 chiffres.',
      });
      return;
    }

    try {
      setChargement(true);
      await verifierCodeAcces(codeNettoye);
      setCode('');
      navigation.reset({index: 0, routes: [{name: 'Principal'}]});
    } catch (e: any) {
      setAlerte({
        visible: true,
        type: 'erreur' as TypeAlertePersonnalisee,
        titre: 'Erreur',
        message: e?.message ?? 'Code invalide.',
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setChargement(false);
    }
  };

  const deconnexion = async () => {
    try {
      await seDeconnecter();
    } catch {
      // ignore
    }
  };

  return (
    <ArrierePlanGradient>
      <SafeAreaView style={styles.conteneur} edges={['top', 'left', 'right']}>
        <View style={styles.centre}>
          <Text style={styles.titre}>Sécurité</Text>
          <Text style={styles.sousTitre}>
            Entre ton code d’accès pour continuer.
          </Text>

          <View style={styles.carte}>
            <Text style={styles.label}>Code d’accès</Text>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={theme.couleurs.placeholder}
              keyboardType="number-pad"
              autoCorrect={false}
              autoCapitalize="none"
              maxLength={6}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => void valider()}
            />

            <TouchableOpacity
              style={[styles.bouton, chargement && styles.boutonDesactive]}
              disabled={chargement}
              onPress={() => void valider()}>
              <Text style={styles.boutonTexte}>
                {chargement ? 'Validation…' : 'Continuer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.lien} onPress={() => void deconnexion()}>
              <Text style={styles.lienTexte}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AlertePersonnalisee
          visible={alerte.visible}
          type={alerte.type}
          titre={alerte.titre}
          message={alerte.message}
          texteConfirmer="OK"
          onConfirmer={fermerAlerte}
          onAnnuler={fermerAlerte}
        />
      </SafeAreaView>
    </ArrierePlanGradient>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1},
  centre: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.espacement.lg,
    paddingBottom: theme.espacement.xl,
  },
  titre: {
    fontFamily: theme.polices.grasse,
    fontSize: 32,
    color: theme.couleurs.texte,
    textAlign: 'center',
    marginBottom: 8,
  },
  sousTitre: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    textAlign: 'center',
    marginBottom: theme.espacement.xl,
  },
  carte: {
    backgroundColor: 'rgba(253,226,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(253,226,255,0.25)',
    borderRadius: theme.rayonBordure.lg,
    padding: theme.espacement.lg,
  },
  label: {
    fontFamily: theme.polices.reguliere,
    fontSize: 14,
    color: theme.couleurs.texteSecondaire,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.couleurs.champBordure,
    backgroundColor: theme.couleurs.champFond,
    color: theme.couleurs.texteClair,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.polices.grasse,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 4,
  },
  bouton: {
    marginTop: theme.espacement.lg,
    backgroundColor: theme.couleurs.violetAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  boutonDesactive: {
    opacity: 0.6,
  },
  boutonTexte: {
    fontFamily: theme.polices.grasse,
    fontSize: 16,
    color: theme.couleurs.texte,
  },
  lien: {
    marginTop: theme.espacement.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  lienTexte: {
    fontFamily: theme.polices.reguliere,
    color: theme.couleurs.texteClair,
    textDecorationLine: 'underline',
  },
});
