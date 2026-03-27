'use client'

const LEGEND_DATA = [
  {
    col: '% R\u00e9ponse',
    subtitle: "Qualit\u00e9 du message d'accroche",
    quote: "\u00abLa cl\u00e9 du setting, c'est avoir le meilleur taux de r\u00e9ponse possible.\u00bb",
    rules: [
      { color: '#00FF00', label: 'Vert', threshold: '> 40%', meaning: "Message d'accroche excellent \u2014 ne change rien" },
      { color: '#FF9900', label: 'Orange', threshold: '20% \u2013 40%', meaning: 'Pas mal, mais \u00e0 am\u00e9liorer' },
      { color: '#FF0000', label: 'Rouge', threshold: '< 20%', meaning: 'Message \u00e0 retravailler compl\u00e8tement' },
    ],
  },
  {
    col: '% R\u00e9ponse FUP',
    subtitle: 'Qualit\u00e9 des relances',
    quote: '\u00abSi tu es dans le rouge, ton follow-up n\'est pas de qualit\u00e9.\u00bb',
    rules: [
      { color: '#00FF00', label: 'Vert', threshold: '> 30%', meaning: 'Relances pertinentes et efficaces' },
      { color: '#FF9900', label: 'Orange', threshold: '15% \u2013 29%', meaning: 'Relances correctes, \u00e0 am\u00e9liorer' },
      { color: '#FF0000', label: 'Rouge', threshold: '< 15%', meaning: 'Relances trop faibles \u2014 repense ton script FUP' },
    ],
  },
  {
    col: '% RDV/Message',
    subtitle: 'Performance globale (vue macro)',
    quote: '\u00abC\'est une data macro \u2014 elle te dit si ton setting est bon globalement.\u00bb',
    rules: [
      { color: '#00FF00', label: 'Vert', threshold: '> 10%', meaning: 'Setting excellent' },
      { color: '#B7E1CD', label: 'Vert clair', threshold: '5% \u2013 10%', meaning: 'Bonne base, continue \u00e0 optimiser' },
      { color: '#FF9900', label: 'Orange', threshold: '2% \u2013 5%', meaning: 'Correct, cherche o\u00f9 tu perds des RDV' },
      { color: '#FF0000', label: 'Rouge', threshold: '< 2%', meaning: 'Setting global \u00e0 retravailler' },
    ],
  },
  {
    col: '% RDV/R\u00e9ponse',
    subtitle: 'Qualit\u00e9 de la trame de setting',
    quote: '\u00abSi tu es dans le rouge ici, ta trame de setting est claqu\u00e9e.\u00bb',
    rules: [
      { color: '#00FF00', label: 'Vert', threshold: '> 40%', meaning: 'Trame parfaite \u2014 4 personnes sur 10 prennent RDV' },
      { color: '#B7E1CD', label: 'Vert clair', threshold: '30% \u2013 40%', meaning: 'Tr\u00e8s bien \u2014 encore de la marge' },
      { color: '#FF9900', label: 'Orange', threshold: '15% \u2013 30%', meaning: 'Trame \u00e0 retravailler' },
      { color: '#FF0000', label: 'Rouge', threshold: '< 15%', meaning: 'Trame ne convertit pas \u2014 \u00e0 repenser enti\u00e8rement' },
    ],
  },
]

export function CrmLegend() {
  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        L&eacute;gende &mdash; Interpr&eacute;tation des r&eacute;sultats
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {LEGEND_DATA.map((col) => (
          <div key={col.col} className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-sm mb-0.5">{col.col}</p>
            <p className="text-xs text-gray-500 mb-2 italic">{col.subtitle}</p>
            <div className="space-y-1.5">
              {col.rules.map((rule) => (
                <div key={rule.threshold} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 flex-shrink-0 w-3 h-3 rounded-sm border border-gray-300"
                    style={{ backgroundColor: rule.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold">{rule.threshold}</span>
                    <span className="text-xs text-gray-600"> &mdash; {rule.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400 italic leading-snug">{col.quote}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
