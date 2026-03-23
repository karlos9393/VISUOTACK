'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DateRangePicker, type DateRange } from '@/components/contenu/DateRangePicker'
import { FunnelBar } from './FunnelBar'
import { SetterAlert } from './SetterAlert'
import { DailyLog, type DayEntry } from './DailyLog'
import { KPICards } from './KPICards'
import { WeeklyTrend } from './WeeklyTrend'
import { EditLogModal } from './EditLogModal'

interface SetterLog {
  id?: string
  user_id?: string
  date: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
  notes?: string | null
  users?: { full_name: string | null; email: string | null } | null
  [key: string]: unknown
}

interface PipelineViewProps {
  allLogs: SetterLog[]
  hasTodayLog: boolean
  todayFilledBy?: string[]
}

export function PipelineView({ allLogs, hasTodayLog, todayFilledBy = [] }: PipelineViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  })
  const [editingDay, setEditingDay] = useState<DayEntry | null>(null)

  // Filtrer les logs par la période sélectionnée
  const periodLogs = useMemo(() => {
    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')
    return allLogs.filter((l) => l.date >= startStr && l.date <= endStr)
  }, [allLogs, dateRange])

  // Totaux sur la période
  const totals = useMemo(() =>
    periodLogs.reduce(
      (acc, log) => ({
        conversations: acc.conversations + (log.conversations ?? 0),
        qualified: acc.qualified + (log.qualified ?? 0),
        links_sent: acc.links_sent + (log.links_sent ?? 0),
        calls_booked: acc.calls_booked + (log.calls_booked ?? 0),
      }),
      { conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0 }
    ), [periodLogs])

  // Générer les entrées : une ligne par log (multi-setter), une ligne vide si aucun log
  const dayEntries = useMemo(() => {
    const now = new Date()
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    }).reverse() // du plus récent au plus ancien

    const entries: DayEntry[] = []
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayName = format(day, 'EEE dd/MM', { locale: fr })
      const future = isAfter(day, now)
      const dayLogs = periodLogs.filter((l) => l.date === dateStr)

      if (dayLogs.length === 0) {
        entries.push({
          date: dateStr,
          dayName,
          conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0,
          notes: '', filled: false, filled_by: null, user_id: null, isFuture: future,
        })
      } else {
        dayLogs.forEach((log, i) => {
          entries.push({
            date: dateStr,
            dayName: i === 0 ? dayName : '',
            conversations: log.conversations ?? 0,
            qualified: log.qualified ?? 0,
            links_sent: log.links_sent ?? 0,
            calls_booked: log.calls_booked ?? 0,
            notes: log.notes || '',
            filled: true,
            filled_by: log.users?.full_name || null,
            user_id: log.user_id || null,
            isFuture: future,
          })
        })
      }
    }
    return entries
  }, [dateRange, periodLogs])

  // Sparkline data (jours passés uniquement)
  const sparklineData = useMemo(() =>
    dayEntries
      .filter((d) => !d.isFuture)
      .reverse() // chronologique pour le graphique
      .map((d) => ({ day: d.dayName, booked: d.calls_booked })),
    [dayEntries])

  // Period label
  const periodLabel = useMemo(() => {
    const s = format(dateRange.start, 'd MMMM', { locale: fr })
    const e = format(dateRange.end, 'd MMMM yyyy', { locale: fr })
    return `du ${s} au ${e}`
  }, [dateRange])

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Setter alert */}
      <SetterAlert hasTodayLog={hasTodayLog} filledBy={todayFilledBy} />

      {/* Funnel */}
      <FunnelBar totals={totals} />

      {/* Activité quotidienne — 2 colonnes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité quotidienne</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyLog days={dayEntries} onEdit={setEditingDay} />
          <KPICards totals={totals} sparklineData={sparklineData} />
        </div>
      </div>

      {/* Weekly trend */}
      <WeeklyTrend allLogs={allLogs} />

      {/* Edit modal — overlay absolute sur le conteneur relative */}
      {editingDay && (
        <EditLogModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
        />
      )}
    </div>
  )
}
