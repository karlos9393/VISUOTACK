'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { KpiGrid } from './kpi-grid'
import { PostsTable } from './posts-table'
import { TemporalChart, PostPerformanceChart, FormatPieChart } from './performance-charts'
import { FollowersInsights } from './followers-insights'
import type { IGMedia, IGAccountStats, IGAccountInsightsDay, IGMediaInsights } from '@/lib/services/instagram'

function formatFR(n: number): string {
  return n.toLocaleString('fr-FR')
}

function filterByRange(media: IGMedia[], range: DateRange): IGMedia[] {
  return media.filter(m => {
    const d = new Date(m.timestamp)
    return d >= range.start && d <= range.end
  })
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
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
  // Default: 7 derniers jours
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  })

  const accountStats = initialAccountStats
  const allMedia = initialMedia
  const tokenExpired = initialTokenExpired

  const [insights, setInsights] = useState<Record<string, IGMediaInsights>>({})
  const [accountInsights, setAccountInsights] = useState<IGAccountInsightsDay[]>([])

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
    const since = toDateStr(dateRange.start)
    const until = toDateStr(dateRange.end)
    fetch(`/api/instagram/account?since=${since}&until=${until}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => setAccountInsights(res.data || []))
      .catch(() => setAccountInsights([]))
  }, [dateRange])

  // Posts filtrés par période
  const periodMedia = useMemo(() => filterByRange(allMedia, dateRange), [allMedia, dateRange])

  // KPIs
  const totalViews = useMemo(() =>
    periodMedia.reduce((s, p) => s + (insights[p.id]?.views || 0), 0), [periodMedia, insights])
  const totalLikes = useMemo(() =>
    periodMedia.reduce((s, p) => s + (p.like_count || 0), 0), [periodMedia])
  const totalComments = useMemo(() =>
    periodMedia.reduce((s, p) => s + (p.comments_count || 0), 0), [periodMedia])
  const totalSaves = useMemo(() =>
    periodMedia.reduce((s, p) => s + (insights[p.id]?.saved || 0), 0), [periodMedia, insights])

  // Meilleur post de la période (basé sur les likes)
  const bestPost = useMemo(() => {
    if (periodMedia.length === 0) return null
    const best = periodMedia.reduce((b, p) =>
      (p.like_count || 0) > (b.like_count || 0) ? p : b
    , periodMedia[0])
    return {
      id: best.id,
      thumbnail: best.thumbnail_url || best.media_url,
      caption: best.caption || best.id,
      views: insights[best.id]?.views || 0,
      likes: best.like_count || 0,
    }
  }, [periodMedia, insights])

  const kpiItems = [
    {
      title: 'Abonnés',
      value: accountStats?.followers_count ? formatFR(accountStats.followers_count) : '-',
      subtitle: accountStats ? `@${accountStats.username}` : undefined,
    },
    {
      title: 'Posts publiés',
      value: periodMedia.length,
      subtitle: 'sur période',
    },
    {
      title: 'Vues',
      value: totalViews > 0 ? formatFR(totalViews) : '-',
      subtitle: 'sur période',
    },
    {
      title: 'Likes',
      value: formatFR(totalLikes),
      subtitle: 'sur période',
    },
    {
      title: 'Commentaires',
      value: formatFR(totalComments),
      subtitle: 'sur période',
    },
    {
      title: 'Saves',
      value: totalSaves > 0 ? formatFR(totalSaves) : '-',
      subtitle: 'sur période',
    },
  ]

  // Subtitle with period range
  const periodLabel = useMemo(() => {
    const s = format(dateRange.start, 'd MMMM', { locale: fr })
    const e = format(dateRange.end, 'd MMMM yyyy', { locale: fr })
    return `${periodMedia.length} posts — du ${s} au ${e}`
  }, [dateRange, periodMedia.length])

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Performance Instagram</h1>
            {!tokenExpired && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {periodLabel}
        </p>
      </div>

      <KpiGrid items={kpiItems} bestPost={bestPost} />

      <PostsTable media={periodMedia} bestPostId={bestPost?.id} insights={insights} />

      <TemporalChart data={accountInsights} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostPerformanceChart media={periodMedia} insights={insights} />
        <FormatPieChart media={periodMedia} insights={insights} />
      </div>

      <FollowersInsights data={accountInsights} />
    </div>
  )
}
