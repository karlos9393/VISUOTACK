import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/ui/kpi-card'
import { IgMediaTable } from '@/components/contenu/ig-media-table'
import { ContentTrend } from '@/components/contenu/content-trend'
import { getAccountStats, getMediaList } from '@/lib/services/instagram'
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Données live Instagram
  const [accountStats, mediaList] = await Promise.all([
    getAccountStats(),
    getMediaList(),
  ])

  const tokenExpired = !accountStats && !mediaList.length

  // Calculs à partir des données live
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  // Posts de cette semaine
  const weekPosts = mediaList.filter(m => new Date(m.timestamp) >= weekStart)
  const totalLikes = weekPosts.reduce((s, p) => s + (p.like_count || 0), 0)
  const totalComments = weekPosts.reduce((s, p) => s + (p.comments_count || 0), 0)

  // Posts de la semaine précédente
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const prevWeekPosts = mediaList.filter(m => {
    const d = new Date(m.timestamp)
    return d >= prevWeekStart && d <= prevWeekEnd
  })
  const prevLikes = prevWeekPosts.reduce((s, p) => s + (p.like_count || 0), 0)
  const likesTrend = prevLikes > 0
    ? Math.round(((totalLikes - prevLikes) / prevLikes) * 100)
    : 0

  // Données tendance 8 semaines (à partir des posts récupérés)
  const trendData = []
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const wPosts = mediaList.filter(m => {
      const d = new Date(m.timestamp)
      return d >= ws && d <= we
    })
    trendData.push({
      week: format(ws, 'dd/MM', { locale: fr }),
      views: wPosts.reduce((s, p) => s + (p.like_count || 0), 0),
      followers: wPosts.reduce((s, p) => s + (p.comments_count || 0), 0),
    })
  }

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
        <p className="text-gray-500 mt-1">
          Semaine du {format(weekStart, 'dd MMMM yyyy', { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Abonnés"
          value={accountStats?.followers_count?.toLocaleString('fr-FR') ?? '-'}
          subtitle={accountStats ? `@${accountStats.username}` : undefined}
        />
        <KpiCard
          title="Posts cette semaine"
          value={weekPosts.length}
        />
        <KpiCard
          title="Likes cette semaine"
          value={totalLikes.toLocaleString('fr-FR')}
          trend={prevLikes > 0 ? { value: likesTrend, label: 'vs semaine préc.' } : undefined}
        />
        <KpiCard
          title="Commentaires"
          value={totalComments.toLocaleString('fr-FR')}
        />
      </div>

      <IgMediaTable media={mediaList} />

      <ContentTrend data={trendData} />
    </div>
  )
}
