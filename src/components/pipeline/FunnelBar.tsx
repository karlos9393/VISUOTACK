import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { conversionRate, rateColor } from '@/lib/utils'

interface FunnelBarProps {
  totals: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
  }
}

export function FunnelBar({ totals }: FunnelBarProps) {
  const steps = [
    { label: 'Conv. actives', value: totals.conversations },
    { label: 'Qualifiés', value: totals.qualified },
    { label: 'Liens envoyés', value: totals.links_sent },
    { label: 'Calls bookés', value: totals.calls_booked },
  ]

  return (
    <Card>
      <CardTitle>Funnel de la période</CardTitle>
      <div className="flex items-center gap-1 overflow-x-auto py-4">
        {steps.map((step, i) => {
          const rate = i > 0 ? conversionRate(steps[i - 1].value, step.value) : null
          return (
            <div key={step.label} className="flex items-center gap-1">
              {i > 0 && (
                <>
                  <Badge className={rate !== null ? rateColor(rate) : ''}>
                    {rate !== null ? (steps[i - 1].value === 0 ? '—' : `${rate}%`) : ''}
                  </Badge>
                  <span className="text-gray-300 text-xl font-light mx-1">›</span>
                </>
              )}
              <div className="flex flex-col items-center min-w-[110px] px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-gray-900">{step.value}</span>
                <span className="text-xs text-gray-500 mt-1 text-center">{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
