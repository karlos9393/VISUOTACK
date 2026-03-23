'use client'

import { useState, useMemo, useCallback } from 'react'
import { startOfWeek, endOfWeek, subWeeks, endOfDay } from 'date-fns'
import Link from 'next/link'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IGMedia, IGMediaInsights } from '@/lib/services/instagram'

// ---- Types ----

interface PeriodData {
  posts: IGMedia[]
  insights: Record<string, IGMediaInsights>
}

interface CompareResult {
  periodA: PeriodData
  periodB: PeriodData
}

interface MergedPost {
  post: IGMedia
  insights: IGMediaInsights
  period: 'A' | 'B'
}

// ---- Helpers ----

function formatFR(n: number): string {
  return n.toLocaleString('fr-FR')
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Paris',
})

const periodFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Paris',
})

function formatPeriodLabel(range: DateRange): string {
  return `${periodFmt.format(range.start)} – ${periodFmt.format(range.end)}`
}

type SortKey = 'views' | 'likes' | 'comments' | 'saved'

// ---- Sub-components ----

function CompareKpiCard({ title, valueA, valueB }: { title: string; valueA: number; valueB: number }) {
  let delta: string
  if (valueA === 0 && valueB === 0) {
    delta = '='
  } else if (valueA === 0) {
    delta = '+∞'
  } else {
    const pct = Math.round(((valueB - valueA) / valueA) * 100)
    delta = pct > 0 ? `+${pct}%` : `${pct}%`
  }

  const isPositive = valueB > valueA
  const isNegative = valueB < valueA

  return (
    <Card className="py-4 px-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold text-violet-700">{formatFR(valueA)}</span>
        <span className="text-gray-400">/</span>
        <span className="text-lg font-bold text-teal-700">{formatFR(valueB)}</span>
      </div>
      <p className={cn(
        'mt-1 text-xs font-semibold',
        isPositive && 'text-green-600',
        isNegative && 'text-red-600',
        !isPositive && !isNegative && 'text-gray-400',
      )}>
        {delta}
      </p>
    </Card>
  )
}

function SkeletonKpis() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="py-4 px-4">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="mt-3 h-7 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-3 w-12 bg-gray-200 rounded animate-pulse" />
        </Card>
      ))}
    </div>
  )
}

function SkeletonTable() {
  return (
    <Card>
      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </Card>
  )
}

function SkeletonSummary() {
  return (
    <Card>
      <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="mt-4 grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <div className="h-3 w-12 mx-auto bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-6 w-64 mx-auto bg-gray-200 rounded animate-pulse" />
    </Card>
  )
}

// ---- Main Component ----

export function ComparerDashboard() {
  const now = new Date()
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })

  const [rangeA, setRangeA] = useState<DateRange>({
    start: lastWeekStart,
    end: lastWeekEnd,
  })
  const [rangeB, setRangeB] = useState<DateRange>({
    start: thisWeekStart,
    end: endOfDay(now),
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('views')
  const [sortAsc, setSortAsc] = useState(false)

  const fetchComparison = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startA: toDateStr(rangeA.start),
        endA: toDateStr(rangeA.end),
        startB: toDateStr(rangeB.start),
        endB: toDateStr(rangeB.end),
      })
      const res = await fetch(`/api/instagram/compare?${params}`)
      if (!res.ok) throw new Error('Erreur API')
      const data: CompareResult = await res.json()
      setResult(data)
    } catch {
      setError('Impossible de charger la comparaison')
    } finally {
      setLoading(false)
    }
  }, [rangeA, rangeB])

  // Compute KPIs
  const kpis = useMemo(() => {
    if (!result) return null

    function sumMetric(posts: IGMedia[], insights: Record<string, IGMediaInsights>, key: 'views' | 'saved' | 'likes' | 'comments') {
      return posts.reduce((sum, p) => {
        if (key === 'likes') return sum + (p.like_count || 0)
        if (key === 'comments') return sum + (p.comments_count || 0)
        return sum + (insights[p.id]?.[key] || 0)
      }, 0)
    }

    const { periodA, periodB } = result
    return {
      posts: { a: periodA.posts.length, b: periodB.posts.length },
      views: { a: sumMetric(periodA.posts, periodA.insights, 'views'), b: sumMetric(periodB.posts, periodB.insights, 'views') },
      likes: { a: sumMetric(periodA.posts, periodA.insights, 'likes'), b: sumMetric(periodB.posts, periodB.insights, 'likes') },
      comments: { a: sumMetric(periodA.posts, periodA.insights, 'comments'), b: sumMetric(periodB.posts, periodB.insights, 'comments') },
      saves: { a: sumMetric(periodA.posts, periodA.insights, 'saved'), b: sumMetric(periodB.posts, periodB.insights, 'saved') },
    }
  }, [result])

  // Merge + sort posts
  const mergedPosts = useMemo(() => {
    if (!result) return []

    const merged: MergedPost[] = []
    for (const p of result.periodA.posts) {
      merged.push({ post: p, insights: result.periodA.insights[p.id] || {}, period: 'A' })
    }
    for (const p of result.periodB.posts) {
      merged.push({ post: p, insights: result.periodB.insights[p.id] || {}, period: 'B' })
    }

    merged.sort((a, b) => {
      let va: number, vb: number
      switch (sortKey) {
        case 'views': va = a.insights.views || 0; vb = b.insights.views || 0; break
        case 'likes': va = a.post.like_count || 0; vb = b.post.like_count || 0; break
        case 'comments': va = a.post.comments_count || 0; vb = b.post.comments_count || 0; break
        case 'saved': va = a.insights.saved || 0; vb = b.insights.saved || 0; break
        default: va = 0; vb = 0
      }
      return sortAsc ? va - vb : vb - va
    })

    return merged.slice(0, 20)
  }, [result, sortKey, sortAsc])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={`pb-3 px-2 font-medium cursor-pointer hover:text-gray-900 select-none ${className || ''}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            {sortAsc ? <path d="M6 2l4 5H2z" /> : <path d="M6 10l4-5H2z" />}
          </svg>
        )}
      </span>
    </th>
  )

  // Best period summary
  const summary = useMemo(() => {
    if (!kpis) return null
    const metrics = [
      { label: 'Plus de posts publiés', a: kpis.posts.a, b: kpis.posts.b },
      { label: 'Plus de vues', a: kpis.views.a, b: kpis.views.b },
      { label: 'Plus de likes', a: kpis.likes.a, b: kpis.likes.b },
      { label: 'Plus de commentaires', a: kpis.comments.a, b: kpis.comments.b },
      { label: 'Plus de saves', a: kpis.saves.a, b: kpis.saves.b },
    ]

    let scoreA = 0
    let scoreB = 0
    for (const m of metrics) {
      if (m.a > m.b) scoreA++
      else if (m.b > m.a) scoreB++
    }

    const winner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null
    return { metrics, scoreA, scoreB, winner }
  }, [kpis])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/contenu/performance" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            &larr; Retour à Performance
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Comparaison de périodes</h1>
        </div>
      </div>

      {/* Period selectors */}
      <Card>
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <span className="text-sm font-medium text-gray-700">Période A</span>
            </div>
            <DateRangePicker value={rangeA} onChange={setRangeA} />
          </div>

          <span className="text-gray-400 font-medium text-sm lg:pb-2">vs</span>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-sm font-medium text-gray-700">Période B</span>
            </div>
            <DateRangePicker value={rangeB} onChange={setRangeB} />
          </div>

          <Button onClick={fetchComparison} disabled={loading} className="lg:mb-0">
            {loading ? 'Chargement...' : 'Comparer'}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-6">
          <SkeletonKpis />
          <SkeletonTable />
          <SkeletonSummary />
        </div>
      )}

      {/* Results */}
      {!loading && result && kpis && summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <CompareKpiCard title="Posts" valueA={kpis.posts.a} valueB={kpis.posts.b} />
            <CompareKpiCard title="Vues" valueA={kpis.views.a} valueB={kpis.views.b} />
            <CompareKpiCard title="Likes" valueA={kpis.likes.a} valueB={kpis.likes.b} />
            <CompareKpiCard title="Commentaires" valueA={kpis.comments.a} valueB={kpis.comments.b} />
            <CompareKpiCard title="Saves" valueA={kpis.saves.a} valueB={kpis.saves.b} />
          </div>

          {/* Merged posts table */}
          <Card>
            <CardTitle>Top posts des deux périodes</CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              Jusqu&apos;à 20 posts, triés par {sortKey === 'views' ? 'vues' : sortKey === 'likes' ? 'likes' : sortKey === 'comments' ? 'commentaires' : 'saves'}
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-3 pr-2 font-medium w-12"></th>
                    <th className="pb-3 px-2 font-medium">Période</th>
                    <th className="pb-3 pr-3 font-medium">Caption</th>
                    <th className="pb-3 px-2 font-medium">Date</th>
                    <SortHeader label="Vues" k="views" className="text-right" />
                    <SortHeader label="Likes" k="likes" className="text-right" />
                    <SortHeader label="Com." k="comments" className="text-right" />
                    <SortHeader label="Saves" k="saved" className="text-right" />
                    <th className="pb-3 pl-2 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {mergedPosts.map((item) => {
                    const { post, insights: ins, period } = item
                    const periodColor = period === 'A'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-teal-100 text-teal-700'
                    const periodLabel = period === 'A' ? formatPeriodLabel(rangeA) : formatPeriodLabel(rangeB)
                    const caption = post.caption
                      ? post.caption.length > 50 ? post.caption.slice(0, 50) + '...' : post.caption
                      : '-'

                    return (
                      <tr key={`${post.id}-${period}`} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-2">
                          {(post.thumbnail_url || post.media_url) ? (
                            <img src={post.thumbnail_url || post.media_url} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200" />
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <Badge className={periodColor}>{periodLabel}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-gray-900 font-medium max-w-[180px] truncate">{caption}</td>
                        <td className="py-2 px-2 text-gray-500 text-xs whitespace-nowrap">{dateFmt.format(new Date(post.timestamp))}</td>
                        <td className={cn('py-2 px-2 text-right tabular-nums font-medium', period === 'A' ? 'text-violet-700' : 'text-teal-700')}>
                          {ins.views != null ? formatFR(ins.views) : '-'}
                        </td>
                        <td className={cn('py-2 px-2 text-right tabular-nums', period === 'A' ? 'text-violet-700' : 'text-teal-700')}>
                          {formatFR(post.like_count || 0)}
                        </td>
                        <td className={cn('py-2 px-2 text-right tabular-nums', period === 'A' ? 'text-violet-700' : 'text-teal-700')}>
                          {formatFR(post.comments_count || 0)}
                        </td>
                        <td className={cn('py-2 px-2 text-right tabular-nums', period === 'A' ? 'text-violet-700' : 'text-teal-700')}>
                          {ins.saved ? formatFR(ins.saved) : '-'}
                        </td>
                        <td className="py-2 pl-2">
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer" title="Voir sur Instagram">
                            <svg className="w-4 h-4 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                  {mergedPosts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">Aucun post sur ces périodes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Best period summary */}
          <Card className={cn(
            summary.winner === 'A' && 'bg-violet-50 border-violet-200',
            summary.winner === 'B' && 'bg-teal-50 border-teal-200',
          )}>
            <CardTitle>Bilan de la comparaison</CardTitle>
            <div className="mt-4 space-y-3">
              {summary.metrics.map((m) => {
                const aWins = m.a > m.b
                const bWins = m.b > m.a
                return (
                  <div key={m.label} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{m.label}</span>
                    {aWins && <Badge className="bg-violet-100 text-violet-700">Période A</Badge>}
                    {bWins && <Badge className="bg-teal-100 text-teal-700">Période B</Badge>}
                    {!aWins && !bWins && <span className="text-xs text-gray-400">Égalité</span>}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 text-center">
              {summary.winner ? (
                <p className="text-lg font-bold">
                  <span className={summary.winner === 'A' ? 'text-violet-700' : 'text-teal-700'}>
                    Période {summary.winner}
                  </span>
                  {' '}
                  <span className="text-gray-600 font-medium">
                    remporte {Math.max(summary.scoreA, summary.scoreB)}/5 métriques
                  </span>
                </p>
              ) : (
                <p className="text-lg font-bold text-gray-600">Égalité parfaite</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
