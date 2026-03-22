import { createClient } from '@/lib/supabase/server'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarGrid } from '@/components/contenu/calendar-grid'

interface PageProps {
  searchParams: { month?: string; platform?: string }
}

export default async function CalendrierPage({ searchParams }: PageProps) {
  const monthOffset = Number(searchParams.month || 0)
  const platformFilter = searchParams.platform || 'all'
  const now = new Date()
  const targetMonth = monthOffset > 0
    ? addMonths(now, monthOffset)
    : monthOffset < 0
      ? subMonths(now, Math.abs(monthOffset))
      : now

  const monthStart = startOfMonth(targetMonth)
  const monthEnd = endOfMonth(targetMonth)
  // Jours affichés : du lundi de la première semaine au dimanche de la dernière
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const supabase = createClient()

  let query = supabase
    .from('content_posts')
    .select('*')
    .gte('scheduled_at', format(calStart, 'yyyy-MM-dd'))
    .lte('scheduled_at', format(calEnd, 'yyyy-MM-dd'))
    .order('scheduled_at', { ascending: true })

  if (platformFilter !== 'all') {
    query = query.eq('platform', platformFilter)
  }

  const { data: posts } = await query
  const contentPosts = posts || []

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const prevMonth = monthOffset - 1
  const nextMonth = monthOffset + 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier éditorial</h1>
          <p className="text-gray-500 mt-1 capitalize">
            {format(targetMonth, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`?month=${prevMonth}&platform=${platformFilter}`}
            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium"
          >
            ←
          </a>
          {monthOffset !== 0 && (
            <a
              href={`?platform=${platformFilter}`}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium"
            >
              Aujourd&apos;hui
            </a>
          )}
          <a
            href={`?month=${nextMonth}&platform=${platformFilter}`}
            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium"
          >
            →
          </a>
        </div>
      </div>

      <CalendarGrid
        days={days}
        posts={contentPosts}
        platformFilter={platformFilter}
        currentMonth={targetMonth}
      />

      {/* Section Google Drive */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.71 3.5L1.15 15l4.58 6h11.84l4.58-6L15.59 3.5H7.71zM14 3.5l6.85 11.5H14l-6.85-11.5H14zm-7.71 0L13.15 15H6.29L1.15 3.5h5.14zm-.15 12.5h11.72l-3.58 5H9.72l-3.58-5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ressources contenu</h2>
            <p className="text-sm text-gray-500">Visuels, templates et fichiers de production</p>
          </div>
        </div>
        <a
          href="https://drive.google.com/drive/folders/1klZUPPvyGD1KpxmeLrsfeMQVUUXmAZhl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ouvrir le Drive
        </a>
      </div>
    </div>
  )
}
