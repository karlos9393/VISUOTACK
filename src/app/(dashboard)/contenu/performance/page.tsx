import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { KpiCard } from '@/components/ui/kpi-card'
import { WeekNavigator } from '@/components/pipeline/week-navigator'
import { PostStatsTable } from '@/components/contenu/post-stats-table'
import { ContentTrend } from '@/components/contenu/content-trend'

interface PageProps {
  searchParams: { week?: string }
}

export default async function PerformancePage({ searchParams }: PageProps) {
  const weekOffset = Number(searchParams.week || 0)
  const now = new Date()
  const targetDate = subWeeks(now, weekOffset)
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })
  const isSunday = now.getDay() === 0

  const supabase = createClient()

  // Posts publiés cette semaine
  const { data: posts } = await supabase
    .from('content_posts')
    .select('*')
    .eq('status', 'publie')
    .gte('scheduled_at', format(weekStart, 'yyyy-MM-dd'))
    .lte('scheduled_at', format(weekEnd, 'yyyy-MM-dd'))
    .order('views', { ascending: false })

  const weekPosts = posts || []
  const totalViews = weekPosts.reduce((s, p) => s + p.views, 0)
  const totalFollowers = weekPosts.reduce((s, p) => s + p.followers_gained, 0)
  const bestPost = weekPosts[0]

  // Semaine précédente pour comparaison
  const prevWeekStart = startOfWeek(subWeeks(targetDate, 1), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subWeeks(targetDate, 1), { weekStartsOn: 1 })
  const { data: prevPosts } = await supabase
    .from('content_posts')
    .select('views, followers_gained')
    .eq('status', 'publie')
    .gte('scheduled_at', format(prevWeekStart, 'yyyy-MM-dd'))
    .lte('scheduled_at', format(prevWeekEnd, 'yyyy-MM-dd'))

  const prevData = prevPosts || []
  const prevViews = prevData.reduce((s, p) => s + p.views, 0)
  const prevFollowers = prevData.reduce((s, p) => s + p.followers_gained, 0)

  const viewsTrend = prevViews > 0 ? Math.round(((totalViews - prevViews) / prevViews) * 100) : 0
  const followersTrend = prevFollowers > 0 ? Math.round(((totalFollowers - prevFollowers) / prevFollowers) * 100) : 0

  // Données tendance 8 semaines
  const trendData = []
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const { data: wPosts } = await supabase
      .from('content_posts')
      .select('views, followers_gained')
      .eq('status', 'publie')
      .gte('scheduled_at', format(ws, 'yyyy-MM-dd'))
      .lte('scheduled_at', format(we, 'yyyy-MM-dd'))

    const wd = wPosts || []
    trendData.push({
      week: format(ws, 'dd/MM', { locale: fr }),
      views: wd.reduce((s, p) => s + p.views, 0),
      followers: wd.reduce((s, p) => s + p.followers_gained, 0),
    })
  }

  return (
    <div className="space-y-6">
      {isSunday && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-800">
            C&apos;est dimanche — as-tu rempli les stats de la semaine ?
          </span>
          <a href="#stats-table" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Remplir les stats
          </a>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance contenu</h1>
          <p className="text-gray-500 mt-1">
            Semaine du {format(weekStart, 'dd MMMM', { locale: fr })} au {format(weekEnd, 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <WeekNavigator currentOffset={weekOffset} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Posts publiés"
          value={weekPosts.length}
        />
        <KpiCard
          title="Vues totales"
          value={totalViews.toLocaleString('fr-FR')}
          trend={prevViews > 0 ? { value: viewsTrend, label: 'vs semaine préc.' } : undefined}
        />
        <KpiCard
          title="Abonnés gagnés"
          value={totalFollowers}
          trend={prevFollowers > 0 ? { value: followersTrend, label: 'vs semaine préc.' } : undefined}
        />
        <KpiCard
          title="Meilleur post"
          value={bestPost?.title || '-'}
          subtitle={bestPost ? `${bestPost.views.toLocaleString('fr-FR')} vues` : undefined}
        />
      </div>

      <div id="stats-table">
        <PostStatsTable posts={weekPosts} />
      </div>

      <ContentTrend data={trendData} />
    </div>
  )
}
