// Source unique de vérité pour les KPI du SUIVI SETTING.
// Formules + seuils + couleurs, partagés par le tableau (DayRow/TotalRow),
// l'aperçu du formulaire CRM Setting et la légende.
//
// ⚠️ Les couleurs ci-dessous sont SÉMANTIQUES (vert/orange/rouge) et n'ont rien à
// voir avec l'accent corail de la marque : ne pas les tokeniser.

export const KPI_COLORS = {
  green: '#00FF00',       // 🟩 bon
  greenLight: '#B7E1CD',  // 🟢 correct / bonne base
  orange: '#FF9900',      // 🟧 à améliorer
  red: '#FF0000',         // 🟥 à retravailler
} as const

// Champs bruts nécessaires au calcul des KPI (sous-ensemble de CrmDailyEntry).
export interface CrmMetricsInput {
  conversations_entrantes: number
  outbound_envoyes: number
  reponses_outbound: number
  fup_envoyes: number
  reponses_fup: number
  liens_rdv_envoyes: number
  rdv_bookes: number
  rdv_qualifies: number
}

export type KpiKey =
  | 'pct_rdv_conv'
  | 'pct_rep'
  | 'pct_rep_fup'
  | 'pct_rdv_outbound'
  | 'pct_rdv_rep'
  | 'pct_liens_rdv'
  | 'pct_qualif'

interface Band {
  color: string
  threshold: string // libellé affiché dans la légende (ex. "> 40%")
  meaning: string
  min: number       // borne basse en % — exclusive pour la 1re bande, inclusive ensuite ; -Infinity = fallback
}

export interface KpiDef {
  key: KpiKey
  label: string     // en-tête de colonne
  subtitle: string
  quote: string
  provisional?: boolean
  numerator: (r: CrmMetricsInput) => number
  denominator: (r: CrmMetricsInput) => number
  bands: Band[]     // du meilleur au pire ; dernière bande = fallback (min: -Infinity)
}

export const KPI_DEFS: KpiDef[] = [
  {
    key: 'pct_rdv_conv',
    label: '% RDV/CONV',
    subtitle: 'Conversion conversation entrante → RDV (vue macro)',
    quote: '«Chaque conversation entrante est une opportunité — combien finissent en RDV ?»',    numerator: (r) => r.rdv_bookes,
    denominator: (r) => r.conversations_entrantes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 30%', min: 30, meaning: 'Excellent — une grande part des conversations deviennent des RDV' },
      { color: KPI_COLORS.greenLight, threshold: '15% – 30%', min: 15, meaning: 'Bonne base — continue à optimiser la prise de RDV' },
      { color: KPI_COLORS.orange, threshold: '5% – 15%', min: 5, meaning: 'Correct — beaucoup de conversations n\'aboutissent pas à un RDV' },
      { color: KPI_COLORS.red, threshold: '< 5%', min: -Infinity, meaning: 'Faible — revois l\'accroche et la trame, les conversations ne se transforment pas' },
    ],
  },
  {
    key: 'pct_rep',
    label: '% RÉP.',
    subtitle: "Qualité du message d'accroche",
    quote: "«La clé du setting, c'est avoir le meilleur taux de réponse possible.»",
    numerator: (r) => r.reponses_outbound,
    denominator: (r) => r.outbound_envoyes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 40%', min: 40, meaning: "Message d'accroche excellent — ne change rien" },
      { color: KPI_COLORS.orange, threshold: '20% – 40%', min: 20, meaning: 'Pas mal, mais à améliorer' },
      { color: KPI_COLORS.red, threshold: '< 20%', min: -Infinity, meaning: 'Message à retravailler complètement' },
    ],
  },
  {
    key: 'pct_rep_fup',
    label: '% RÉP. FUP',
    subtitle: 'Qualité des relances',
    quote: "«Si tu es dans le rouge, ton follow-up n'est pas de qualité.»",
    numerator: (r) => r.reponses_fup,
    denominator: (r) => r.fup_envoyes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 30%', min: 30, meaning: 'Relances pertinentes et efficaces' },
      { color: KPI_COLORS.orange, threshold: '15% – 30%', min: 15, meaning: 'Relances correctes, à améliorer' },
      { color: KPI_COLORS.red, threshold: '< 15%', min: -Infinity, meaning: 'Relances trop faibles — repense ton script FUP' },
    ],
  },
  {
    key: 'pct_rdv_outbound',
    label: '% RDV/OUTBOUND',
    subtitle: 'Performance globale (vue macro)',
    quote: '«C\'est une data macro — elle te dit si ton setting est bon globalement.»',
    numerator: (r) => r.rdv_bookes,
    denominator: (r) => r.outbound_envoyes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 10%', min: 10, meaning: 'Setting excellent' },
      { color: KPI_COLORS.greenLight, threshold: '5% – 10%', min: 5, meaning: 'Bonne base, continue à optimiser' },
      { color: KPI_COLORS.orange, threshold: '2% – 5%', min: 2, meaning: 'Correct, cherche où tu perds des RDV' },
      { color: KPI_COLORS.red, threshold: '< 2%', min: -Infinity, meaning: 'Setting global à retravailler' },
    ],
  },
  {
    key: 'pct_rdv_rep',
    label: '% RDV/RÉP',
    subtitle: 'Qualité de la trame de setting',
    quote: '«Si tu es dans le rouge ici, ta trame de setting est claquée.»',
    numerator: (r) => r.rdv_bookes,
    denominator: (r) => r.reponses_outbound + r.reponses_fup,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 40%', min: 40, meaning: 'Trame parfaite — 4 personnes sur 10 prennent RDV' },
      { color: KPI_COLORS.greenLight, threshold: '30% – 40%', min: 30, meaning: 'Très bien — encore de la marge' },
      { color: KPI_COLORS.orange, threshold: '15% – 30%', min: 15, meaning: 'Trame à retravailler' },
      { color: KPI_COLORS.red, threshold: '< 15%', min: -Infinity, meaning: 'Trame ne convertit pas — à repenser entièrement' },
    ],
  },
  {
    key: 'pct_liens_rdv',
    label: '% LIENS→RDV',
    subtitle: 'Conversion lien RDV envoyé → RDV booké',
    quote: '«Si tu envoies un lien, la personne doit booker. Un lien envoyé trop tôt ou sans engagement = rouge.»',
    numerator: (r) => r.rdv_bookes,
    denominator: (r) => r.liens_rdv_envoyes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 80%', min: 80, meaning: 'Excellent — tu envoies les liens au bon moment, presque tout le monde booke' },
      { color: KPI_COLORS.greenLight, threshold: '50% – 80%', min: 50, meaning: 'Bien — plus de la moitié des liens aboutissent à un RDV' },
      { color: KPI_COLORS.orange, threshold: '30% – 50%', min: 30, meaning: 'Moyen — liens envoyés trop tôt ou à des prospects pas assez qualifiés' },
      { color: KPI_COLORS.red, threshold: '< 30%', min: -Infinity, meaning: 'Faible — requalifie mieux avant d\'envoyer le lien' },
    ],
  },
  {
    key: 'pct_qualif',
    label: '% QUALIF',
    subtitle: 'Qualité / maturité des RDV pris',
    quote: '«Un RDV qualifié, c\'est un prospect réellement dans la cible et prêt à avancer.»',    numerator: (r) => r.rdv_qualifies,
    denominator: (r) => r.rdv_bookes,
    bands: [
      { color: KPI_COLORS.green, threshold: '> 60%', min: 60, meaning: 'Excellente qualification en amont' },
      { color: KPI_COLORS.greenLight, threshold: '40% – 60%', min: 40, meaning: 'Bonne base — la majorité des RDV sont solides' },
      { color: KPI_COLORS.orange, threshold: '20% – 40%', min: 20, meaning: 'Trop de RDV faibles — filtre mieux avant de booker' },
      { color: KPI_COLORS.red, threshold: '< 20%', min: -Infinity, meaning: 'Qualification à revoir — RDV majoritairement hors cible' },
    ],
  },
]

const KPI_MAP: Record<KpiKey, KpiDef> = Object.fromEntries(
  KPI_DEFS.map((d) => [d.key, d])
) as Record<KpiKey, KpiDef>

/** Valeur d'un KPI en % (0–100), ou null si division par zéro. */
export function computeKpiValue(key: KpiKey, r: CrmMetricsInput): number | null {
  const def = KPI_MAP[key]
  const den = def.denominator(r)
  if (den <= 0) return null
  return (def.numerator(r) / den) * 100
}

/** Tous les KPI d'une ligne (bruts, non formatés). */
export function computeAllKpis(r: CrmMetricsInput): Record<KpiKey, number | null> {
  return Object.fromEntries(
    KPI_DEFS.map((d) => [d.key, computeKpiValue(d.key, r)])
  ) as Record<KpiKey, number | null>
}

/** Couleur de fond sémantique d'une cellule KPI. '' si valeur nulle (—). */
export function getKpiColor(key: KpiKey, value: number | null): string {
  if (value === null) return ''
  const bands = KPI_MAP[key].bands
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i]
    const hit = i === 0 ? value > b.min : value >= b.min
    if (hit) return b.color
  }
  return bands[bands.length - 1].color
}

/** Formatage d'affichage : "42.5%" ou "—". */
export function formatKpi(value: number | null): string {
  return value === null ? '—' : value.toFixed(1) + '%'
}
