'use client'

import { Card, CardTitle } from '@/components/ui/card'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface ContentTrendProps {
  data: { week: string; views: number; followers: number }[]
}

export function ContentTrend({ data }: ContentTrendProps) {
  return (
    <Card>
      <CardTitle>Tendance 8 semaines</CardTitle>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="views"
              fill="#3b82f6"
              name="Vues totales"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="followers"
              stroke="#10b981"
              strokeWidth={2}
              name="Abonnés gagnés"
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
