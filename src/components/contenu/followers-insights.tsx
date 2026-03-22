'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { IGAccountInsightsDay } from '@/lib/services/instagram'

interface FollowersInsightsProps {
  data: IGAccountInsightsDay[]
  prevData?: IGAccountInsightsDay[]
  compareEnabled?: boolean
}

export function FollowersInsights({ data, prevData, compareEnabled }: FollowersInsightsProps) {
  if (data.length === 0) return null

  const first = data[0]?.follower_count || 0
  const last = data[data.length - 1]?.follower_count || 0
  const gained = last - first

  const chartData = data.map((d, i) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    followers: d.follower_count,
    followers_prev: compareEnabled && prevData?.[i] ? prevData[i].follower_count : undefined,
  }))

  return (
    <Card>
      <CardTitle>Évolution des abonnés</CardTitle>
      <div className="mt-3 flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-500">Début : </span>
          <span className="font-semibold text-gray-900">{first.toLocaleString('fr-FR')}</span>
        </div>
        <div>
          <span className="text-gray-500">Fin : </span>
          <span className="font-semibold text-gray-900">{last.toLocaleString('fr-FR')}</span>
        </div>
        <div>
          <span className="text-gray-500">Gagnés : </span>
          <span className={`font-semibold ${gained >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gained >= 0 ? '+' : ''}{gained.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="followers"
              stroke="#7c3aed"
              strokeWidth={2}
              name="Abonnés"
              dot={false}
            />
            {compareEnabled && (
              <Line
                type="monotone"
                dataKey="followers_prev"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name="Préc."
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
