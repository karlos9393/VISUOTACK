import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { conversionRate, rateColor } from '@/lib/utils'

interface FunnelViewProps {
  totals: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
  }
}

export function FunnelView({ totals }: FunnelViewProps) {
  const steps = [
    { label: 'Conversations', value: totals.conversations },
    { label: 'Qualifiés', value: totals.qualified },
    { label: 'Liens envoyés', value: totals.links_sent },
    { label: 'Calls bookés', value: totals.calls_booked },
  ]

  return (
    <Card>
      <CardTitle>Funnel de la semaine</CardTitle>
      <div className="flex items-center gap-2 overflow-x-auto py-4">
        {steps.map((step, i) => {
          const rate = i > 0 ? conversionRate(steps[i - 1].value, step.value) : null
          return (
            <div key={step.label} className="flex items-center gap-2">
              {rate !== null && (
                <Badge className={rateColor(rate)}>
                  {rate}%
                </Badge>
              )}
              <div className="flex flex-col items-center min-w-[110px] px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-gray-900">{step.value}</span>
                <span className="text-xs text-gray-500 mt-1 text-center">{step.label}</span>
              </div>
              {i < steps.length - 1 && rate === null && (
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
