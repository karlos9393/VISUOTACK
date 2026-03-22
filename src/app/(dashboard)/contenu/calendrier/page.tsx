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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Ressources contenu</h2>
          <a
            href="https://drive.google.com/drive/folders/1klZUPPvyGD1KpxmeLrsfeMQVUUXmAZhl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ouvrir dans Drive
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        {/* Le dossier Drive doit être partagé "Toute personne avec le lien peut voir" pour que l'iframe fonctionne */}
        <iframe
          src="https://drive.google.com/embeddedfolderview?id=1klZUPPvyGD1KpxmeLrsfeMQVUUXmAZhl#list"
          style={{ width: '100%', height: '500px', border: 'none', borderRadius: '12px' }}
          title="Drive contenu CYGA"
        />
      </div>
    </div>
  )
}
