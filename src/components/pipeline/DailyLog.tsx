'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditLogModal } from './EditLogModal'

interface DayEntry {
  date: string
  dayName: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
  filled: boolean
  isFuture: boolean
}

interface DailyLogProps {
  days: DayEntry[]
}

export function DailyLog({ days }: DailyLogProps) {
  const [editingDay, setEditingDay] = useState<DayEntry | null>(null)

  const maxConv = Math.max(...days.map((d) => d.conversations), 1)
  const maxLinks = Math.max(...days.map((d) => d.links_sent), 1)

  return (
    <Card>
      <CardTitle>Log jour par jour</CardTitle>
      <div className="mt-4 space-y-2">
        {days.map((day) => (
          <div
            key={day.date}
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

            <div className="flex-shrink-0 w-24 flex justify-end">
              {!day.filled && !day.isFuture ? (
                <Badge className="bg-red-100 text-red-700">Non rempli</Badge>
              ) : day.filled ? (
                <button
                  onClick={() => setEditingDay(day)}
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

      {editingDay && (
        <EditLogModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
        />
      )}
    </Card>
  )
}
