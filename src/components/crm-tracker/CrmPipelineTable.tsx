'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, getWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { PeriodSelector } from './MonthSelector'
import { SetterSelector } from './SetterSelector'
import { CrmKPICards } from './CrmKPICards'
import { WeekGroup } from './WeekGroup'
import type { DayData } from './DayRow'
import type { CrmDailyEntry } from '@/lib/types'
import { getCrmEntriesForMonth } from '@/lib/actions/crm-tracker'

interface SetterOption {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface CrmPipelineTableProps {
  currentUserId: string
  currentUserRole: string
  setters: SetterOption[]
  initialEntries: CrmDailyEntry[]
  initialYear: number
  initialMonth: number
}

interface WeekData {
  weekNumber: number
  days: DayData[]
}

function buildWeeksForMonth(
  year: number,
  month: number,
  entries: CrmDailyEntry[]
): WeekData[] {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd })

  const weekMap = new Map<number, Date[]>()
  for (const day of allDays) {
    const wn = getWeek(day, { weekStartsOn: 1 })
    if (!weekMap.has(wn)) weekMap.set(wn, [])
    weekMap.get(wn)!.push(day)
  }

  const entryMap = new Map<string, CrmDailyEntry>()
  for (const e of entries) {
    entryMap.set(e.date, e)
  }

  const weeks: WeekData[] = []
  let weekIdx = 1
  const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) =>
    a[1][0].getTime() - b[1][0].getTime()
  )

  for (const [, weekDays] of sortedWeeks) {
    const days: DayData[] = weekDays.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const entry = entryMap.get(dateStr)
      return {
        date: dateStr,
        messages_envoyes: entry?.messages_envoyes ?? 0,
        reponses: entry?.reponses ?? 0,
        fup_envoyes: entry?.fup_envoyes ?? 0,
        reponses_fup: entry?.reponses_fup ?? 0,
        rdv_bookes: entry?.rdv_bookes ?? 0,
      }
    })
    weeks.push({ weekNumber: weekIdx, days })
    weekIdx++
  }

  return weeks
}

export function CrmPipelineTable({
  currentUserId,
  currentUserRole,
  setters,
  initialEntries,
  initialYear,
  initialMonth,
}: CrmPipelineTableProps) {
  const [selectedSetter, setSelectedSetter] = useState(currentUserId)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [entries, setEntries] = useState<CrmDailyEntry[]>(initialEntries)
  const [isPending, startTransition] = useTransition()

  // Client-side filtering by selected setter
  const filteredEntries = useMemo(
    () => entries.filter(e => e.setter_id === selectedSetter),
    [entries, selectedSetter]
  )

  const weeks = useMemo(
    () => buildWeeksForMonth(year, month, filteredEntries),
    [year, month, filteredEntries]
  )

  function handleMonthNavigate(newDate: Date) {
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    setYear(newYear)
    setMonth(newMonth)
    startTransition(async () => {
      const data = await getCrmEntriesForMonth(newYear, newMonth)
      setEntries(data as CrmDailyEntry[])
    })
  }

  function handleSetterChange(setterId: string) {
    // No re-fetch needed — data already includes all setters, filtering is client-side
    setSelectedSetter(setterId)
  }

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: fr })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Performance CRM</h2>
        <div className="flex items-center gap-4">
          <SetterSelector
            setters={setters}
            selectedId={selectedSetter}
            onChange={handleSetterChange}
          />
          <PeriodSelector
            viewMode="month"
            currentDate={new Date(year, month - 1, 1)}
            onNavigate={handleMonthNavigate}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <CrmKPICards entries={filteredEntries} />

      {/* Tableau lecture seule */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        {isPending && (
          <div className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-medium">
            Chargement...
          </div>
        )}
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left font-medium w-24">Semaine</th>
              <th className="px-3 py-3 text-left font-medium">Date</th>
              <th className="px-3 py-3 text-center font-medium">Msg</th>
              <th className="px-3 py-3 text-center font-medium">R&eacute;p.</th>
              <th className="px-3 py-3 text-center font-medium">FUP</th>
              <th className="px-3 py-3 text-center font-medium">R.FUP</th>
              <th className="px-3 py-3 text-center font-medium">RDV</th>
              <th className="w-2 bg-gray-700" />
              <th className="px-3 py-3 text-center font-medium bg-gray-700">%R&eacute;p</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">%R.FUP</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">%RDV/Msg</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">%RDV/R&eacute;p</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <WeekGroup
                key={week.weekNumber}
                weekNumber={week.weekNumber}
                days={week.days}
                readOnly
                onCellChange={() => {}}
              />
            ))}
          </tbody>
        </table>
        {weeks.length === 0 && !isPending && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Aucune donn&eacute;e CRM pour {monthLabel}
          </div>
        )}
      </div>
    </div>
  )
}
