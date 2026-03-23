'use client'

import { Card } from '@/components/ui/card'
import type { SetterStats as SetterStatsType } from '@/lib/actions/setter-logs'

function streakMessage(streak: number): string {
  if (streak === 0) return 'Commence ta série aujourd\'hui'
  if (streak === 1) return 'Bon début, continue !'
  if (streak <= 2) return 'C\'est parti, garde le rythme !'
  if (streak <= 6) return 'Belle série, ne la casse pas !'
  if (streak <= 13) return `Série de ${streak} jours — tu es en feu !`
  return `${streak} jours sans interruption — exceptionnel`
}

interface SetterStatsProps {
  stats: SetterStatsType
}

export function SetterStats({ stats }: SetterStatsProps) {
  const { thisWeek, linksDelta, streak } = stats

  return (
    <div className="space-y-3 mb-6 max-w-md mx-auto">
      {/* Semaine en cours */}
      <Card className="!py-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Ta semaine</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-violet-600">{thisWeek.conversations}</p>
            <p className="text-[11px] text-gray-500">conv.</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{thisWeek.qualified}</p>
            <p className="text-[11px] text-gray-500">qualifiés</p>
          </div>
          <div>
            <p className="text-lg font-bold text-teal-600">{thisWeek.links_sent}</p>
            <p className="text-[11px] text-gray-500">liens</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{thisWeek.calls_booked}</p>
            <p className="text-[11px] text-gray-500">calls</p>
          </div>
        </div>
        {linksDelta !== null && (
          <p className={`text-xs mt-3 ${linksDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {linksDelta >= 0 ? '+' : ''}{linksDelta}% de liens vs semaine derni&egrave;re {linksDelta >= 0 ? '↑' : '↓'}
          </p>
        )}
      </Card>

      {/* Série */}
      <Card className="!py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Série en cours{streak > 0 ? ` : ${streak} jour${streak > 1 ? 's' : ''}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{streakMessage(streak)}</p>
        </div>
        {streak >= 3 && (
          <span className="text-2xl" role="img" aria-label="fire">🔥</span>
        )}
      </Card>
    </div>
  )
}
