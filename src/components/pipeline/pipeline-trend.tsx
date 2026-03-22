'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PipelineTrendProps {
  data: { week: string; booked: number; links: number }[]
}

export function PipelineTrend({ data }: PipelineTrendProps) {
  return (
    <Card>
      <CardTitle>Tendance 4 semaines</CardTitle>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="booked"
              stroke="#2563eb"
              strokeWidth={2}
              name="Calls bookés"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="links"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Liens envoyés"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
