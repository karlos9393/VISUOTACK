'use client'

import { useState, useMemo, useCallback, useTransition, useRef } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, getWeek,
} from 'date-fns'
import { PeriodSelector } from './MonthSelector'
import { ViewToggle, type ViewMode } from './ViewToggle'
import { SetterSelector } from './SetterSelector'
import { WeekGroup } from './WeekGroup'
import { DayRow, type DayData } from './DayRow'
import { TotalRow } from './TotalRow'
import type { CrmDailyEntry } from '@/lib/types'
import {
  upsertCrmEntryInline,
  getCrmEntriesForMonth,
  getCrmEntriesForDateRange,
} from '@/lib/actions/crm-tracker'
import { useToast } from '@/components/ui/toast'
import { CrmLegend } from './CrmLegend'

interface SetterOption {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface CrmTrackerPageProps {
  currentUserId: string
  currentUserRole: string
  setters: SetterOption[]
  initialEntries: CrmDailyEntry[]
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
  for (const e of entries) entryMap.set(e.date, e)

  const weeks: WeekData[] = []
  let weekIdx = 1
  const sortedWeeks = Array.from(weekMap.entries()).sort(
    (a, b) => a[1][0].getTime() - b[1][0].getTime()
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
        updater: entry?.updater ?? null,
        updated_at: entry?.updated_at ?? '',
      }
    })
    weeks.push({ weekNumber: weekIdx, days })
    weekIdx++
  }

  return weeks
}

function buildWeekDays(refDate: Date, entries: CrmDailyEntry[]): DayData[] {
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(refDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const entryMap = new Map<string, CrmDailyEntry>()
  for (const e of entries) entryMap.set(e.date, e)

  return days.map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const entry = entryMap.get(dateStr)
    return {
      date: dateStr,
      messages_envoyes: entry?.messages_envoyes ?? 0,
      reponses: entry?.reponses ?? 0,
      fup_envoyes: entry?.fup_envoyes ?? 0,
      reponses_fup: entry?.reponses_fup ?? 0,
      rdv_bookes: entry?.rdv_bookes ?? 0,
      updater: entry?.updater ?? null,
      updated_at: entry?.updated_at ?? '',
    }
  })
}

export function CrmTrackerPage({
  currentUserId,
  currentUserRole,
  setters,
  initialEntries,
}: CrmTrackerPageProps) {
  const isAdmin = ['admin', 'manager'].includes(currentUserRole)
  const [selectedSetter, setSelectedSetter] = useState(currentUserId)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [entries, setEntries] = useState<CrmDailyEntry[]>(initialEntries)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Compute month year from currentDate for month mode
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // Client-side filtering by selected setter
  const filteredEntries = useMemo(
    () => entries.filter(e => e.setter_id === selectedSetter),
    [entries, selectedSetter]
  )

  // Build data for current view (uses filtered entries)
  const weeks = useMemo(
    () => viewMode === 'month' ? buildWeeksForMonth(year, month, filteredEntries) : [],
    [viewMode, year, month, filteredEntries]
  )

  const weekDays = useMemo(
    () => viewMode === 'week' ? buildWeekDays(currentDate, filteredEntries) : [],
    [viewMode, currentDate, filteredEntries]
  )

  // Week number for week view label
  const weekNumber = useMemo(() => {
    if (viewMode !== 'week') return 0
    return getWeek(currentDate, { weekStartsOn: 1 })
  }, [viewMode, currentDate])

  const readOnly = !isAdmin && selectedSetter !== currentUserId
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Fetch ALL entries for current period (no setter filter — client-side filtering)
  async function fetchData(date: Date, mode: ViewMode) {
    startTransition(async () => {
      if (mode === 'month') {
        const y = date.getFullYear()
        const m = date.getMonth() + 1
        const data = await getCrmEntriesForMonth(y, m)
        setEntries(data as CrmDailyEntry[])
      } else {
        const ws = startOfWeek(date, { weekStartsOn: 1 })
        const we = endOfWeek(date, { weekStartsOn: 1 })
        const data = await getCrmEntriesForDateRange(
          format(ws, 'yyyy-MM-dd'),
          format(we, 'yyyy-MM-dd')
        )
        setEntries(data as CrmDailyEntry[])
      }
    })
  }

  function handleNavigate(newDate: Date) {
    setCurrentDate(newDate)
    fetchData(newDate, viewMode)
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode)
    // When switching mode, refetch data for the new view
    if (mode === 'month') {
      // Ensure currentDate is 1st of month for consistency
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      setCurrentDate(monthDate)
      fetchData(monthDate, mode)
    } else {
      fetchData(currentDate, mode)
    }
  }

  function handleSetterChange(setterId: string) {
    // No re-fetch needed — data already includes all setters, filtering is client-side
    setSelectedSetter(setterId)
  }

  const handleCellChange = useCallback(
    async (date: string, field: string, value: number) => {
      // Optimistic update (match by setter_id + date since entries include all setters)
      setEntries((prev) => {
        const existing = prev.find((e) => e.date === date && e.setter_id === selectedSetter)
        if (existing) {
          return prev.map((e) =>
            e.date === date && e.setter_id === selectedSetter ? { ...e, [field]: value } : e
          )
        }
        return [
          ...prev,
          {
            id: '',
            setter_id: selectedSetter,
            date,
            messages_envoyes: 0,
            reponses: 0,
            fup_envoyes: 0,
            reponses_fup: 0,
            rdv_bookes: 0,
            created_at: '',
            updated_at: '',
            updated_by: null,
            [field]: value,
          },
        ]
      })

      // Debounce server call per (date, field) key
      const key = `${date}:${field}`
      const existing = debounceTimers.current.get(key)
      if (existing) clearTimeout(existing)

      return new Promise<void>((resolve) => {
        debounceTimers.current.set(key, setTimeout(async () => {
          debounceTimers.current.delete(key)
          const result = await upsertCrmEntryInline(selectedSetter, date, field, value)
          if (result.error) {
            toast(result.error, 'error')
          }
          resolve()
        }, 300))
      })
    },
    [selectedSetter, toast]
  )

  const setterLabel = useMemo(() => {
    const s = setters.find((s) => s.id === selectedSetter)
    return s?.full_name || s?.email || ''
  }, [setters, selectedSetter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Tracker</h1>
          <p className="text-gray-500 mt-1">
            Suivi d&apos;activit&eacute; {setterLabel ? `\u2014 ${setterLabel}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SetterSelector
            setters={setters}
            selectedId={selectedSetter}
            onChange={handleSetterChange}
          />
        </div>
      </div>

      {/* Toggle + Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ViewToggle value={viewMode} onChange={handleViewModeChange} />
        <PeriodSelector
          viewMode={viewMode}
          currentDate={currentDate}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        {isPending && (
          <div role="status" aria-live="polite" className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-medium">
            Chargement...
          </div>
        )}
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left font-medium w-24">Semaine</th>
              <th className="px-3 py-3 text-left font-medium">Date</th>
              <th className="px-3 py-3 text-center font-medium">Msg envoy&eacute;s</th>
              <th className="px-3 py-3 text-center font-medium">R&eacute;ponses</th>
              <th className="px-3 py-3 text-center font-medium">FUP envoy&eacute;s</th>
              <th className="px-3 py-3 text-center font-medium">R&eacute;p. FUP</th>
              <th className="px-3 py-3 text-center font-medium">RDV book&eacute;s</th>
              <th className="px-2 py-3 text-center font-medium">Par</th>
              <th className="w-2 bg-gray-700" />
              <th className="px-3 py-3 text-center font-medium bg-gray-700">% R&eacute;p.</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">% R&eacute;p. FUP</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">% RDV/Msg</th>
              <th className="px-3 py-3 text-center font-medium bg-gray-700">% RDV/R&eacute;p</th>
            </tr>
          </thead>
          <tbody>
            {viewMode === 'month' ? (
              weeks.map((week) => (
                <WeekGroup
                  key={week.weekNumber}
                  weekNumber={week.weekNumber}
                  days={week.days}
                  readOnly={readOnly}
                  showParColumn
                  onCellChange={handleCellChange}
                />
              ))
            ) : (
              <>
                {weekDays.map((day, i) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    weekLabel={i === 0 ? `Semaine ${weekNumber}` : ''}
                    readOnly={readOnly}
                    showParColumn
                    onCellChange={handleCellChange}
                  />
                ))}
                {weekDays.length > 0 && (
                  <TotalRow days={weekDays} label={`Total S${weekNumber}`} showParColumn />
                )}
              </>
            )}
          </tbody>
        </table>
        {((viewMode === 'month' && weeks.length === 0) ||
          (viewMode === 'week' && weekDays.length === 0)) && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Aucune donn&eacute;e pour cette p&eacute;riode
          </div>
        )}
      </div>

      {/* Légende couleurs */}
      <CrmLegend />
    </div>
  )
}
