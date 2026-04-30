// Système de design centralisé de l'application Flux.
// Toutes les valeurs visuelles (couleurs, polices, espacements) sont définies ici
// pour garantir une cohérence graphique sur l'ensemble des écrans.
export const theme = {
  couleurs: {
    // Dégradé violet foncé → violet profond utilisé comme arrière-plan principal
    debutGradient: '#1a0024',
    milieuGradient: '#3b014a',
    finGradient: '#5c0073',
    primaire: '#FDE2FF',
    texte: '#FFFFFF',
    texteClair: '#FDE2FF',
    violetAccent: '#a855f7',
    boutonPrimaire: '#FDE2FF',
    texteBoutonPrimaire: '#2a0134',
    bordure: '#FDE2FF',
    fondApp: '#14001d',
    surface: 'rgba(253, 226, 255, 0.08)',
    surfaceForte: 'rgba(253, 226, 255, 0.12)',
    surfaceLegere: 'rgba(253, 226, 255, 0.05)',
    bordureSubtile: 'rgba(253, 226, 255, 0.22)',
    bordureMoyenne: 'rgba(253, 226, 255, 0.3)',
    boutonSecondaireFond: 'rgba(253, 226, 255, 0.08)',
    boutonSecondaireBordure: 'rgba(253, 226, 255, 0.3)',
    boutonDesactiveFond: 'rgba(168, 85, 247, 0.28)',
    texteBoutonSecondaire: '#FDE2FF',
    accentRose: '#ff93b7',
    accentRosePale: '#ffc1d4',
    accentLilas: '#d7b4ff',
    accentLavande: '#b98cff',
    accentPrune: '#8d5cf6',

    // États / validations
    erreur: '#ff6b6b',

    // UI (transparents)
    overlayModal: 'rgba(0, 0, 0, 0.6)',
    bordureTransparente: 'rgba(253, 226, 255, 0.3)',
    texteSecondaire: 'rgba(253, 226, 255, 0.8)',
    placeholder: 'rgba(253, 226, 255, 0.5)',
    champFond: 'rgba(253, 226, 255, 0.1)',
    champBordure: 'rgba(253, 226, 255, 0.3)',

    // Alertes — chaque type (confirmation, avertissement, info) a ses propres couleurs
    // pour communiquer visuellement le niveau de sévérité à l'utilisateur
    alerteConfirmationDebut: '#1a0024',
    alerteConfirmationFin: '#3b014a',
    alerteConfirmationBordure: '#a855f7',

    alerteAvertissementDebut: '#2a0000',
    alerteAvertissementFin: '#4a0000',
    alerteAvertissementBordure: '#ff6b6b',

    // Attention (validation / champs manquants) — ambre pour contraster avec l'erreur
    alerteAttentionDebut: '#2a1f00',
    alerteAttentionFin: '#4a3400',
    alerteAttentionBordure: '#fbbf24',

    // Erreur (échec serveur / réseau) — rouge plus marqué que l'avertissement
    alerteErreurDebut: '#1f0000',
    alerteErreurFin: '#3b0000',
    alerteErreurBordure: '#ff4d4d',

    alerteInfoDebut: '#2a0038',
    alerteInfoFin: '#3b014a',
    alerteInfoBordure: 'rgba(253, 226, 255, 0.35)',
  },
  // L'application utilise une seule police (LilitaOne) déclinée en trois
  // aliases pour permettre une migration facile vers des variantes distinctes
  polices: {
    reguliere: 'LilitaOne-Regular',
    moyenne: 'LilitaOne-Regular',
    grasse: 'LilitaOne-Regular',
  },
  // Échelle d'espacement en pixels, du plus petit au plus grand
  espacement: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 60,
  },
  rayonBordure: {
    sm: 8,
    md: 16,
    lg: 24,
  },
};
