'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { PeriodSelector, type PeriodKey } from './period-selector'
import { KpiGrid } from './kpi-grid'
import { PostsTable } from './posts-table'
import { TemporalChart, PostPerformanceChart, FormatPieChart } from './performance-charts'
import { FollowersInsights } from './followers-insights'
import type { IGMedia, IGAccountStats, IGAccountInsightsDay, IGMediaInsights } from '@/lib/services/instagram'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function formatFR(n: number): string {
  return n.toLocaleString('fr-FR')
}

function filterByPeriod(media: IGMedia[], since: string, until: string): IGMedia[] {
  const start = new Date(since)
  start.setHours(0, 0, 0, 0)
  const end = new Date(until)
  end.setHours(23, 59, 59, 999)
  return media.filter(m => {
    const d = new Date(m.timestamp)
    return d >= start && d <= end
  })
}

interface PerformanceDashboardProps {
  initialAccountStats: IGAccountStats | null
  initialMedia: IGMedia[]
  initialTokenExpired: boolean
}

export function PerformanceDashboard({
  initialAccountStats,
  initialMedia,
  initialTokenExpired,
}: PerformanceDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [customStart, setCustomStart] = useState(daysAgo(30))
  const [customEnd, setCustomEnd] = useState(daysAgo(0))
  const [compareEnabled, setCompareEnabled] = useState(false)

  const accountStats = initialAccountStats
  const allMedia = initialMedia
  const tokenExpired = initialTokenExpired

  const [insights, setInsights] = useState<Record<string, IGMediaInsights>>({})
  const [accountInsights, setAccountInsights] = useState<IGAccountInsightsDay[]>([])
  const [prevAccountInsights, setPrevAccountInsights] = useState<IGAccountInsightsDay[]>([])

  // Calculer les dates de la période
  const { since, until, prevSince, prevUntil } = useMemo(() => {
    let days = 30
    let s = '', u = daysAgo(0)
    switch (period) {
      case 'today': days = 1; break
      case '3d': days = 3; break
      case '7d': days = 7; break
      case '14d': days = 14; break
      case '30d': days = 30; break
      case 'custom': {
        s = customStart
        u = customEnd
        days = Math.max(1, Math.round((new Date(u).getTime() - new Date(s).getTime()) / 86400000))
        return {
          since: s,
          until: u,
          prevSince: daysAgo(days * 2 + (Math.round((new Date().getTime() - new Date(u).getTime()) / 86400000))),
          prevUntil: daysAgo(days + (Math.round((new Date().getTime() - new Date(u).getTime()) / 86400000))),
        }
      }
    }
    s = daysAgo(days)
    return {
      since: s,
      until: u,
      prevSince: daysAgo(days * 2),
      prevUntil: daysAgo(days),
    }
  }, [period, customStart, customEnd])

  // Batch fetch insights pour tous les posts (groupes de 5)
  const fetchAllInsights = useCallback(async (media: IGMedia[]) => {
    const batches: IGMedia[][] = []
    for (let i = 0; i < media.length; i += 5) {
      batches.push(media.slice(i, i + 5))
    }
    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (post) => {
          try {
            const res = await fetch(`/api/instagram/media/${post.id}/insights?media_type=${post.media_type}`)
            if (!res.ok) return { id: post.id, data: {} as IGMediaInsights }
            const data = await res.json()
            return { id: post.id, data: data as IGMediaInsights }
          } catch {
            return { id: post.id, data: {} as IGMediaInsights }
          }
        })
      )
      setInsights(prev => {
        const next = { ...prev }
        for (const r of results) {
          next[r.id] = r.data
        }
        return next
      })
    }
  }, [])

  useEffect(() => {
    if (allMedia.length > 0) {
      fetchAllInsights(allMedia)
    }
  }, [allMedia, fetchAllInsights])

  // Charger les account insights quand la période change
  useEffect(() => {
    fetch(`/api/instagram/account?since=${since}&until=${until}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => setAccountInsights(res.data || []))
      .catch(() => setAccountInsights([]))

    if (compareEnabled) {
      fetch(`/api/instagram/account?since=${prevSince}&until=${prevUntil}`)
        .then(r => r.ok ? r.json() : { data: [] })
        .then(res => setPrevAccountInsights(res.data || []))
        .catch(() => setPrevAccountInsights([]))
    }
  }, [since, until, prevSince, prevUntil, compareEnabled])

  // Posts filtrés par période (pour KPIs et graphiques)
  const periodMedia = useMemo(() => filterByPeriod(allMedia, since, until), [allMedia, since, until])
  const prevPeriodMedia = useMemo(() => filterByPeriod(allMedia, prevSince, prevUntil), [allMedia, prevSince, prevUntil])

  // Calculs KPIs — basés sur la période
  const totalImpressions = useMemo(() =>
    periodMedia.reduce((s, p) => s + (insights[p.id]?.impressions || 0), 0), [periodMedia, insights])
  const totalReach = useMemo(() =>
    periodMedia.reduce((s, p) => s + (insights[p.id]?.reach || 0), 0), [periodMedia, insights])
  const totalLikes = useMemo(() =>
    periodMedia.reduce((s, p) => s + (p.like_count || 0), 0), [periodMedia])
  const totalComments = useMemo(() =>
    periodMedia.reduce((s, p) => s + (p.comments_count || 0), 0), [periodMedia])

  // Période précédente pour trends
  const prevImpressions = prevPeriodMedia.reduce((s, p) => s + (insights[p.id]?.impressions || 0), 0)
  const prevReach = prevPeriodMedia.reduce((s, p) => s + (insights[p.id]?.reach || 0), 0)
  const prevLikes = prevPeriodMedia.reduce((s, p) => s + (p.like_count || 0), 0)
  const prevComments = prevPeriodMedia.reduce((s, p) => s + (p.comments_count || 0), 0)

  function trend(curr: number, prev: number): number | null {
    if (prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }

  // Meilleur post de la période (basé sur likes)
  const bestPost = useMemo(() => {
    if (periodMedia.length === 0) return null
    const best = periodMedia.reduce((b, p) =>
      (p.like_count || 0) > (b.like_count || 0) ? p : b
    , periodMedia[0])
    return {
      id: best.id,
      thumbnail: best.thumbnail_url || best.media_url,
      caption: best.caption || best.id,
      views: best.like_count || 0,
      likes: best.like_count || 0,
    }
  }, [periodMedia])

  const kpiItems = [
    {
      title: 'Abonnés',
      value: accountStats?.followers_count ? formatFR(accountStats.followers_count) : '-',
      subtitle: accountStats ? `@${accountStats.username}` : undefined,
      trend: null,
    },
    {
      title: 'Posts publiés',
      value: periodMedia.length,
      subtitle: 'sur période',
      trend: trend(periodMedia.length, prevPeriodMedia.length),
    },
    {
      title: 'Impressions',
      value: formatFR(totalImpressions),
      subtitle: 'sur période',
      trend: trend(totalImpressions, prevImpressions),
    },
    {
      title: 'Reach',
      value: formatFR(totalReach),
      subtitle: 'sur période',
      trend: trend(totalReach, prevReach),
    },
    {
      title: 'Likes',
      value: formatFR(totalLikes),
      subtitle: 'sur période',
      trend: trend(totalLikes, prevLikes),
    },
    {
      title: 'Commentaires',
      value: formatFR(totalComments),
      subtitle: 'sur période',
      trend: trend(totalComments, prevComments),
    },
  ]

  return (
    <div className="space-y-6">
      {tokenExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-800">
            Token Instagram expiré ou invalide. Contacte l&apos;admin pour le renouveler.
          </span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Performance Instagram</h1>
          {!tokenExpired && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {allMedia.length} posts chargés — {periodMedia.length} sur la période sélectionnée
        </p>
      </div>

      <PeriodSelector
        selected={period}
        onSelect={setPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        compareEnabled={compareEnabled}
        onCompareToggle={() => setCompareEnabled(!compareEnabled)}
      />

      <KpiGrid items={kpiItems} bestPost={bestPost} />

      {/* Tableau : montre TOUS les posts, pas seulement la période */}
      <PostsTable media={allMedia} bestPostId={bestPost?.id} insights={insights} />

      <TemporalChart
        data={accountInsights}
        prevData={compareEnabled ? prevAccountInsights : undefined}
        compareEnabled={compareEnabled}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostPerformanceChart media={periodMedia} insights={insights} />
        <FormatPieChart media={periodMedia} insights={insights} />
      </div>

      <FollowersInsights
        data={accountInsights}
        prevData={compareEnabled ? prevAccountInsights : undefined}
        compareEnabled={compareEnabled}
      />
    </div>
  )
}
