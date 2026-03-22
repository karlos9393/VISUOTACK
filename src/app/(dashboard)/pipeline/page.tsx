import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FunnelView } from '@/components/pipeline/funnel-view'
import { WeeklyLogsTable } from '@/components/pipeline/weekly-logs-table'
import { NoCloseReasons } from '@/components/pipeline/no-close-reasons'
import { PipelineTrend } from '@/components/pipeline/pipeline-trend'
import { WeekNavigator } from '@/components/pipeline/week-navigator'

interface PageProps {
  searchParams: { week?: string }
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const weekOffset = Number(searchParams.week || 0)
  const now = new Date()
  const targetDate = subWeeks(now, weekOffset)
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })

  const supabase = createClient()

  // Logs de la semaine
  const { data: logs } = await supabase
    .from('setter_logs')
    .select('*')
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(weekEnd, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  const weekLogs = logs || []

  // Totaux
  const totals = weekLogs.reduce(
    (acc, log) => ({
      conversations: acc.conversations + log.conversations,
      qualified: acc.qualified + log.qualified,
      links_sent: acc.links_sent + log.links_sent,
      calls_booked: acc.calls_booked + log.calls_booked,
      calls_shown: acc.calls_shown + log.calls_shown,
      closes: acc.closes + log.closes,
      no_close_budget: acc.no_close_budget + log.no_close_budget,
      no_close_think: acc.no_close_think + log.no_close_think,
      no_close_trust: acc.no_close_trust + log.no_close_trust,
      no_close_competitor: acc.no_close_competitor + log.no_close_competitor,
    }),
    {
      conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0,
      calls_shown: 0, closes: 0, no_close_budget: 0, no_close_think: 0,
      no_close_trust: 0, no_close_competitor: 0,
    }
  )

  // Données tendance 4 semaines
  const trendData = []
  for (let i = 3; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const { data: wLogs } = await supabase
      .from('setter_logs')
      .select('closes, links_sent')
      .gte('date', format(ws, 'yyyy-MM-dd'))
      .lte('date', format(we, 'yyyy-MM-dd'))

    const wData = wLogs || []
    trendData.push({
      week: format(ws, 'dd/MM', { locale: fr }),
      closes: wData.reduce((s, l) => s + l.closes, 0),
      links: wData.reduce((s, l) => s + l.links_sent, 0),
    })
  }

  // Jours de la semaine avec statut log
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  const dayLogs = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const log = weekLogs.find((l) => l.date === dateStr)
    return {
      date: dateStr,
      dayName: format(day, 'EEEE', { locale: fr }),
      log,
      isFuture: day > now,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 mt-1">
            Semaine du {format(weekStart, 'dd MMMM', { locale: fr })} au {format(weekEnd, 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <WeekNavigator currentOffset={weekOffset} />
      </div>

      <FunnelView totals={totals} />
      <WeeklyLogsTable dayLogs={dayLogs} totals={totals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NoCloseReasons totals={totals} />
        <PipelineTrend data={trendData} />
      </div>
    </div>
  )
}
