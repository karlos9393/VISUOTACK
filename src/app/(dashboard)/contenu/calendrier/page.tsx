import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarGrid } from '@/components/contenu/calendar-grid'
import { WeekNavigator } from '@/components/pipeline/week-navigator'

interface PageProps {
  searchParams: { week?: string; view?: string; platform?: string }
}

export default async function CalendrierPage({ searchParams }: PageProps) {
  const weekOffset = Number(searchParams.week || 0)
  const platformFilter = searchParams.platform || 'all'
  const viewMode = searchParams.view || 'calendar'
  const now = new Date()
  const targetDate = subWeeks(now, weekOffset)
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })

  const supabase = createClient()

  let query = supabase
    .from('content_posts')
    .select('*')
    .gte('scheduled_at', format(weekStart, 'yyyy-MM-dd'))
    .lte('scheduled_at', format(weekEnd, 'yyyy-MM-dd'))
    .order('scheduled_at', { ascending: true })

  if (platformFilter !== 'all') {
    query = query.eq('platform', platformFilter)
  }

  const { data: posts } = await query
  const contentPosts = posts || []

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier éditorial</h1>
          <p className="text-gray-500 mt-1">
            Semaine du {format(weekStart, 'dd MMMM', { locale: fr })} au {format(weekEnd, 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WeekNavigator currentOffset={weekOffset} />
        </div>
      </div>

      <CalendarGrid
        days={days}
        posts={contentPosts}
        platformFilter={platformFilter}
        viewMode={viewMode}
      />
    </div>
  )
}
