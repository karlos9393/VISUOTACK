'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  byOffer: {
    formation: number
    accompagnement: number
    dfy: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

export function RevenueChart({ byOffer }: RevenueChartProps) {
  const data = [
    { name: 'Formation', value: byOffer.formation },
    { name: 'Accompagnement', value: byOffer.accompagnement },
    { name: 'DFY', value: byOffer.dfy },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardTitle>Répartition par offre</CardTitle>
        <div className="mt-4 h-64 flex items-center justify-center text-gray-400 text-sm">
          Aucune donnée disponible
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>Répartition par offre</CardTitle>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value.toLocaleString('fr-FR')}€`}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
