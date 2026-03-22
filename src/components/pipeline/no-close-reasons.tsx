import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NoCloseReasonsProps {
  totals: {
    no_close_budget: number
    no_close_think: number
    no_close_trust: number
    no_close_competitor: number
    closes: number
    calls_shown: number
    calls_booked: number
  }
}

export function NoCloseReasons({ totals }: NoCloseReasonsProps) {
  const reasons = [
    { label: 'Pas le budget', value: totals.no_close_budget, color: 'bg-red-500' },
    { label: 'Besoin de réfléchir', value: totals.no_close_think, color: 'bg-amber-500' },
    { label: 'Pas convaincu', value: totals.no_close_trust, color: 'bg-orange-500' },
    { label: 'Concurrent', value: totals.no_close_competitor, color: 'bg-purple-500' },
  ]

  const maxValue = Math.max(...reasons.map((r) => r.value), 1)
  const closeRate = totals.calls_shown > 0 ? Math.round((totals.closes / totals.calls_shown) * 100) : 0
  const showRate = totals.calls_booked > 0 ? Math.round((totals.calls_shown / totals.calls_booked) * 100) : 0

  return (
    <Card>
      <CardTitle>Raisons de non-close</CardTitle>
      <div className="mt-4 space-y-3">
        {reasons.map((reason) => (
          <div key={reason.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{reason.label}</span>
              <span className="font-medium">{reason.value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', reason.color)}
                style={{ width: `${(reason.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-500">Taux de close</p>
          <p className="text-xl font-bold">{closeRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Show rate</p>
          <p className="text-xl font-bold">{showRate}%</p>
        </div>
      </div>
    </Card>
  )
}
