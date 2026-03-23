'use client'

import { Card } from '@/components/ui/card'
import { conversionRate } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface KPICardsProps {
  totals: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
  }
  sparklineData: { day: string; booked: number }[]
}

export function KPICards({ totals, sparklineData }: KPICardsProps) {
  const convToQualified = totals.conversations > 0
    ? conversionRate(totals.conversations, totals.qualified)
    : null
  const linkToBooking = totals.links_sent > 0
    ? conversionRate(totals.links_sent, totals.calls_booked)
    : null
  const convToCall = totals.conversations > 0
    ? conversionRate(totals.conversations, totals.calls_booked)
    : null

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">KPIs de la période</h3>

      {/* 3 metric cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          label="Conv → qualifié"
          value={convToQualified !== null ? `${convToQualified}%` : '—'}
          color={convToQualified !== null && convToQualified >= 50 ? 'green' : convToQualified !== null && convToQualified >= 30 ? 'orange' : 'red'}
        />
        <MetricCard
          label="Lien → booking"
          value={linkToBooking !== null ? `${linkToBooking}%` : '—'}
          color={linkToBooking !== null && linkToBooking >= 50 ? 'green' : linkToBooking !== null && linkToBooking >= 30 ? 'orange' : 'red'}
        />
        <MetricCard
          label="Conv → call"
          value={convToCall !== null ? `${convToCall}%` : '—'}
          color={convToCall !== null && convToCall >= 50 ? 'green' : convToCall !== null && convToCall >= 30 ? 'orange' : 'red'}
        />
      </div>

      {/* 2 key figures */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total conv. actives</p>
          <p className="text-lg font-bold text-gray-900">{totals.conversations}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total calls bookés</p>
          <p className="text-lg font-bold text-gray-900">{totals.calls_booked}</p>
        </div>
      </div>

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Calls bookés — évolution</p>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Tooltip
                  formatter={(value) => [String(value), 'Calls']}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="booked"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: 'green' | 'orange' | 'red' }) {
  const colors = {
    green: 'bg-[#EAF3DE] text-[#27500A]',
    orange: 'bg-[#FAEEDA] text-[#633806]',
    red: 'bg-[#FCEBEB] text-[#791F1F]',
  }

  return (
    <div className={`rounded-lg p-3 text-center ${value === '—' ? 'bg-gray-50 text-gray-400' : colors[color]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}
