'use client'

import { Card, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { IGAccountInsightsDay, IGMedia, IGMediaInsights } from '@/lib/services/instagram'

// — Graphique 1 : Évolution temporelle (impressions + reach par jour)

interface TemporalChartProps {
  data: IGAccountInsightsDay[]
}

export function TemporalChart({ data }: TemporalChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    impressions: d.impressions,
    reach: d.reach,
  }))

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardTitle>Évolution sur la période</CardTitle>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="impressions" stroke="#7c3aed" strokeWidth={2} name="Impressions" dot={false} />
            <Line type="monotone" dataKey="reach" stroke="#14b8a6" strokeWidth={2} name="Reach" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// — Graphique 2 : Performance par post (barres horizontales)

interface PostPerformanceChartProps {
  media: IGMedia[]
  insights: Record<string, IGMediaInsights>
}

const typeColors: Record<string, string> = {
  REEL: '#7c3aed',
  IMAGE: '#3b82f6',
  CAROUSEL_ALBUM: '#14b8a6',
  VIDEO: '#ef4444',
}

export function PostPerformanceChart({ media, insights }: PostPerformanceChartProps) {
  const data = media
    .map(post => {
      const ins = insights[post.id]
      return {
        name: (post.caption || '').slice(0, 30) || post.id.slice(-6),
        views: ins?.views ?? 0,
        likes: post.like_count ?? 0,
        type: post.media_type,
        fill: typeColors[post.media_type] || '#6b7280',
      }
    })
    .sort((a, b) => b.likes - a.likes)
    .slice(0, Math.min(10, media.length))

  if (data.length === 0) return null

  const title = data.length >= 10
    ? 'Top 10 de la période'
    : `Top ${data.length} de la période`

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
            <Tooltip formatter={(value) => Number(value).toLocaleString('fr-FR')} />
            <Bar dataKey="likes" name="Likes" radius={[0, 4, 4, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

