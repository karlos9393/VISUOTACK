'use client'

import { Card, CardTitle } from '@/components/ui/card'

interface WeeklyTrendProps {
  data: { week: string; booked: number }[]
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
  const maxBooked = Math.max(...data.map((d) => d.booked), 1)

  function barColor(value: number) {
    const intensity = Math.max(0.25, value / maxBooked)
    // Teal gradient: lighter = less, darker = more
    if (intensity >= 0.75) return 'bg-teal-700'
    if (intensity >= 0.5) return 'bg-teal-500'
    if (intensity >= 0.25) return 'bg-teal-400'
    return 'bg-teal-300'
  }

  return (
    <Card>
      <CardTitle>Tendance — 4 semaines glissantes</CardTitle>
      <div className="mt-4 flex items-end justify-between gap-4 h-48 px-4">
        {data.map((item) => {
          const heightPercent = maxBooked > 0 ? (item.booked / maxBooked) * 100 : 0
          return (
            <div key={item.week} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{item.booked}</span>
              <div className="w-full flex justify-center" style={{ height: '140px' }}>
                <div
                  className={`w-12 rounded-t-lg transition-all ${barColor(item.booked)}`}
                  style={{
                    height: `${Math.max(heightPercent, 5)}%`,
                    alignSelf: 'flex-end',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{item.week}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
