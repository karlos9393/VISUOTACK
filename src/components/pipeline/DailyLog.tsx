'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface DayEntry {
  date: string
  dayName: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
  notes?: string
  filled: boolean
  filled_by?: string | null
  user_id?: string | null
  isFuture: boolean
}

interface DailyLogProps {
  days: DayEntry[]
  onEdit: (day: DayEntry) => void
}

export function DailyLog({ days, onEdit }: DailyLogProps) {
  const pastDays = days.filter((d) => !d.isFuture)
  const maxConv = Math.max(...pastDays.map((d) => d.conversations), 1)
  const maxLinks = Math.max(...pastDays.map((d) => d.links_sent), 1)

  if (days.length === 0) {
    return (
      <Card>
        <CardTitle>Log jour par jour</CardTitle>
        <p className="mt-4 text-sm text-gray-400 text-center py-8">Aucune session sur cette période</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>Log jour par jour</CardTitle>
      <div className="mt-4 space-y-2">
        {days.map((day, idx) => (
          <div
            key={`${day.date}-${day.filled_by ?? idx}`}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
              !day.filled && !day.isFuture ? 'bg-gray-50 opacity-60' : ''
            } ${day.isFuture ? 'opacity-40' : ''}`}
          >
            <div className="w-20 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700 capitalize">{day.dayName}</span>
            </div>

            <div className="flex-1 space-y-1.5">
              {/* Conversations bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${(day.conversations / maxConv) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-violet-700 w-8 text-right">
                  {day.conversations}
                </span>
              </div>
              {/* Links sent bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${(day.links_sent / maxLinks) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-teal-700 w-8 text-right">
                  {day.links_sent}
                </span>
              </div>
            </div>

            {/* Rempli par */}
            <div className="flex-shrink-0 w-28 hidden sm:flex items-center">
              {day.filled_by ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                    {day.filled_by.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <span className="text-xs text-gray-500 truncate">{day.filled_by}</span>
                </div>
              ) : day.filled ? (
                <span className="text-xs text-gray-400">&mdash;</span>
              ) : null}
            </div>

            <div className="flex-shrink-0 w-24 flex justify-end">
              {!day.filled && !day.isFuture ? (
                <Badge className="bg-red-100 text-red-700">Non rempli</Badge>
              ) : day.filled ? (
                <button
                  onClick={() => onEdit(day)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Modifier
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-violet-500" /> Conv. actives
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-teal-500" /> Liens envoyés
        </span>
      </div>
    </Card>
  )
}
