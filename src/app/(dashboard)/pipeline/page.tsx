import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, startOfMonth, subWeeks, eachDayOfInterval, addDays, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { FunnelBar } from '@/components/pipeline/FunnelBar'
import { PeriodSelector } from '@/components/pipeline/PeriodSelector'
import { SetterAlert } from '@/components/pipeline/SetterAlert'
import { DailyLog } from '@/components/pipeline/DailyLog'
import { KPICards } from '@/components/pipeline/KPICards'
import { WeeklyTrend } from '@/components/pipeline/WeeklyTrend'

interface PageProps {
  searchParams: { period?: string }
}

function getPeriodRange(period: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return { start: today, end: today }
    case 'month':
      return { start: startOfMonth(today), end: today }
    case '4weeks':
      return { start: subWeeks(today, 4), end: today }
    case 'week':
    default:
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      }
  }
}

function getPreviousPeriodRange(period: string) {
  const { start, end } = getPeriodRange(period)
  const durationMs = end.getTime() - start.getTime()
  const durationDays = Math.max(Math.round(durationMs / (1000 * 60 * 60 * 24)), 1)
  const prevEnd = subDays(start, 1)
  const prevStart = subDays(prevEnd, durationDays - 1)
  return { start: prevStart, end: prevEnd }
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const period = searchParams.period || 'week'
  const { start: periodStart, end: periodEnd } = getPeriodRange(period)
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period)
  const now = new Date()

  const supabase = createClient()

  // Fetch logs for current period
  const { data: logs } = await supabase
    .from('setter_logs')
    .select('*')
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  const periodLogs = logs || []

  // Fetch logs for previous period (for comparison)
  const { data: prevLogs } = await supabase
    .from('setter_logs')
    .select('conversations, qualified, links_sent, calls_booked')
    .gte('date', format(prevStart, 'yyyy-MM-dd'))
    .lte('date', format(prevEnd, 'yyyy-MM-dd'))

  const previousLogs = prevLogs || []

  // Check if setter filled today
  const todayStr = format(now, 'yyyy-MM-dd')
  const hasTodayLog = periodLogs.some((l) => l.date === todayStr)

  // Totals
  const totals = periodLogs.reduce(
    (acc, log) => ({
      conversations: acc.conversations + log.conversations,
      qualified: acc.qualified + log.qualified,
      links_sent: acc.links_sent + log.links_sent,
      calls_booked: acc.calls_booked + log.calls_booked,
    }),
    { conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0 }
  )

  const previousTotals = previousLogs.reduce(
    (acc, log) => ({
      conversations: acc.conversations + log.conversations,
      qualified: acc.qualified + log.qualified,
      links_sent: acc.links_sent + log.links_sent,
      calls_booked: acc.calls_booked + log.calls_booked,
    }),
    { conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0 }
  )

  // Build day-by-day entries
  const days = eachDayOfInterval({
    start: periodStart,
    end: period === 'today' ? periodStart : addDays(periodEnd, 0),
  })

  const dayEntries = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const log = periodLogs.find((l) => l.date === dateStr)
    return {
      date: dateStr,
      dayName: format(day, 'EEE dd/MM', { locale: fr }),
      conversations: log?.conversations ?? 0,
      qualified: log?.qualified ?? 0,
      links_sent: log?.links_sent ?? 0,
      calls_booked: log?.calls_booked ?? 0,
      filled: !!log,
      isFuture: day > now,
    }
  })

  // Sparkline data
  const sparklineData = dayEntries
    .filter((d) => !d.isFuture)
    .map((d) => ({
      day: d.dayName,
      booked: d.calls_booked,
    }))

  // Weekly trend (4 weeks)
  const trendData = []
  for (let i = 3; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const { data: wLogs } = await supabase
      .from('setter_logs')
      .select('calls_booked')
      .gte('date', format(ws, 'yyyy-MM-dd'))
      .lte('date', format(we, 'yyyy-MM-dd'))

    const wData = wLogs || []
    trendData.push({
      week: `Sem. ${format(ws, 'dd/MM', { locale: fr })}`,
      booked: wData.reduce((s, l) => s + l.calls_booked, 0),
    })
  }

  // Period label
  const periodLabel =
    period === 'today'
      ? format(now, 'dd MMMM yyyy', { locale: fr })
      : period === 'month'
        ? format(now, 'MMMM yyyy', { locale: fr })
        : `${format(periodStart, 'dd MMM', { locale: fr })} — ${format(periodEnd, 'dd MMM yyyy', { locale: fr })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <PeriodSelector />
      </div>

      {/* Setter alert */}
      <SetterAlert hasTodayLog={hasTodayLog} />

      {/* Funnel */}
      <FunnelBar totals={totals} />

      {/* Activité quotidienne — 2 colonnes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité quotidienne</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyLog days={dayEntries} />
          <KPICards
            totals={totals}
            previousTotals={previousTotals}
            sparklineData={sparklineData}
          />
        </div>
      </div>

      {/* Weekly trend */}
      <WeeklyTrend data={trendData} />
    </div>
  )
}
