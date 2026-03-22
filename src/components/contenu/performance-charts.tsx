'use client'

import { Card, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { IGAccountInsightsDay, IGMedia, IGMediaInsights } from '@/lib/services/instagram'

// — Graphique 1 : Évolution temporelle (impressions + reach par jour)

interface TemporalChartProps {
  data: IGAccountInsightsDay[]
  prevData?: IGAccountInsightsDay[]
  compareEnabled?: boolean
}

export function TemporalChart({ data, prevData, compareEnabled }: TemporalChartProps) {
  const chartData = data.map((d, i) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    impressions: d.impressions,
    reach: d.reach,
    impressions_prev: compareEnabled && prevData?.[i] ? prevData[i].impressions : undefined,
    reach_prev: compareEnabled && prevData?.[i] ? prevData[i].reach : undefined,
  }))

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
            {compareEnabled && (
              <>
                <Line type="monotone" dataKey="impressions_prev" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 5" name="Impr. préc." dot={false} />
                <Line type="monotone" dataKey="reach_prev" stroke="#14b8a6" strokeWidth={1.5} strokeDasharray="5 5" name="Reach préc." dot={false} />
              </>
            )}
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
      const isVideo = post.media_type === 'REEL' || post.media_type === 'VIDEO'
      const views = isVideo ? (ins?.video_views ?? ins?.plays ?? 0) : (ins?.impressions ?? 0)
      return {
        name: (post.caption || '').slice(0, 30) || post.id.slice(-6),
        views,
        type: post.media_type,
        fill: typeColors[post.media_type] || '#6b7280',
      }
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  if (data.length === 0) return null

  return (
    <Card>
      <CardTitle>Top 10 posts</CardTitle>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
            <Tooltip formatter={(value) => Number(value).toLocaleString('fr-FR')} />
            <Bar dataKey="views" name="Vues" radius={[0, 4, 4, 0]}>
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

// — Graphique 3 : Répartition des formats

interface FormatPieChartProps {
  media: IGMedia[]
  insights: Record<string, IGMediaInsights>
}

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#14b8a6', '#ef4444']

export function FormatPieChart({ media, insights }: FormatPieChartProps) {
  const groups: Record<string, { count: number; totalViews: number }> = {}

  for (const post of media) {
    const type = post.media_type
    if (!groups[type]) groups[type] = { count: 0, totalViews: 0 }
    groups[type].count++
    const ins = insights[post.id]
    const isVideo = type === 'REEL' || type === 'VIDEO'
    groups[type].totalViews += isVideo ? (ins?.video_views ?? ins?.plays ?? 0) : (ins?.impressions ?? 0)
  }

  const data = Object.entries(groups).map(([type, g]) => ({
    name: type === 'CAROUSEL_ALBUM' ? 'Carrousel' : type === 'REEL' ? 'Reel' : type === 'VIDEO' ? 'Vidéo' : 'Image',
    value: g.count,
    avgViews: g.count > 0 ? Math.round(g.totalViews / g.count) : 0,
    pct: media.length > 0 ? Math.round((g.count / media.length) * 100) : 0,
  }))

  if (data.length === 0) return null

  return (
    <Card>
      <CardTitle>Répartition formats</CardTitle>
      <div className="mt-4 h-80 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, payload }) => `${name} ${(payload as { pct?: number })?.pct ?? 0}%`}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => {
              const avgViews = (props?.payload as { avgViews?: number })?.avgViews ?? 0
              return [`${value} posts (moy. ${avgViews.toLocaleString('fr-FR')} vues)`, name]
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
