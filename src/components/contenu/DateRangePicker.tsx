'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export interface DateRange {
  start: Date
  end: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

interface QuickPeriod {
  label: string
  getRange: () => DateRange
}

const quickPeriods: QuickPeriod[] = [
  {
    label: "Aujourd'hui",
    getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }),
  },
  {
    label: 'Hier',
    getRange: () => {
      const d = subDays(new Date(), 1)
      return { start: startOfDay(d), end: endOfDay(d) }
    },
  },
  {
    label: "Aujourd'hui et hier",
    getRange: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(new Date()) }),
  },
  {
    label: '7 derniers jours',
    getRange: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }),
  },
  {
    label: '14 derniers jours',
    getRange: () => ({ start: startOfDay(subDays(new Date(), 13)), end: endOfDay(new Date()) }),
  },
  {
    label: '28 derniers jours',
    getRange: () => ({ start: startOfDay(subDays(new Date(), 27)), end: endOfDay(new Date()) }),
  },
  {
    label: '30 derniers jours',
    getRange: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }),
  },
  {
    label: 'Cette semaine',
    getRange: () => ({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfDay(new Date()),
    }),
  },
  {
    label: 'Semaine dernière',
    getRange: () => {
      const lastWeek = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
      return {
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      }
    },
  },
  {
    label: 'Ce mois-ci',
    getRange: () => ({
      start: startOfMonth(new Date()),
      end: endOfDay(new Date()),
    }),
  },
  {
    label: 'Mois dernier',
    getRange: () => {
      const prev = subMonths(new Date(), 1)
      return { start: startOfMonth(prev), end: endOfMonth(prev) }
    },
  },
]

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function CalendarMonth({
  month,
  rangeStart,
  rangeEnd,
  hoveredDate,
  onDateClick,
  onDateHover,
}: {
  month: Date
  rangeStart: Date | null
  rangeEnd: Date | null
  hoveredDate: Date | null
  onDateClick: (d: Date) => void
  onDateHover: (d: Date | null) => void
}) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start: Monday = 0 ... Sunday = 6
  const startDow = (monthStart.getDay() + 6) % 7
  const padBefore = Array.from({ length: startDow }, () => null)

  const effectiveEnd = rangeEnd || hoveredDate

  return (
    <div className="w-[260px]">
      <p className="text-sm font-semibold text-gray-900 text-center mb-2 capitalize">
        {format(month, 'MMMM yyyy', { locale: fr })}
      </p>
      <div className="grid grid-cols-7 gap-0">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10px] font-medium text-gray-400 text-center pb-1">
            {d}
          </div>
        ))}
        {padBefore.map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isStart = rangeStart && isSameDay(day, rangeStart)
          const isEnd = effectiveEnd && isSameDay(day, effectiveEnd)
          const isInRange =
            rangeStart &&
            effectiveEnd &&
            !isBefore(effectiveEnd, rangeStart) &&
            isWithinInterval(day, {
              start: startOfDay(rangeStart),
              end: endOfDay(effectiveEnd),
            })
          const isToday = isSameDay(day, new Date())
          const isFuture = isAfter(day, new Date())

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isFuture}
              onClick={() => onDateClick(day)}
              onMouseEnter={() => onDateHover(day)}
              onMouseLeave={() => onDateHover(null)}
              className={`
                h-8 w-full text-xs transition-colors relative
                ${isFuture ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
                ${isInRange && !isStart && !isEnd ? 'bg-blue-50' : ''}
                ${isStart ? 'bg-blue-600 text-white rounded-l-full' : ''}
                ${isEnd && !isStart ? 'bg-blue-600 text-white rounded-r-full' : ''}
                ${isStart && isEnd ? 'rounded-full' : ''}
                ${isToday && !isStart && !isEnd ? 'font-bold text-blue-600' : ''}
                ${!isInRange && !isStart && !isEnd && !isFuture ? 'text-gray-700' : ''}
              `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [selectingStart, setSelectingStart] = useState<Date | null>(null)
  const [selectingEnd, setSelectingEnd] = useState<Date | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [activeQuick, setActiveQuick] = useState<string>('7 derniers jours')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const handleQuickSelect = useCallback(
    (period: QuickPeriod) => {
      const range = period.getRange()
      onChange(range)
      setActiveQuick(period.label)
      setSelectingStart(null)
      setSelectingEnd(null)
      setOpen(false)
    },
    [onChange]
  )

  const handleDateClick = useCallback(
    (day: Date) => {
      if (!selectingStart || selectingEnd) {
        // Start new selection
        setSelectingStart(day)
        setSelectingEnd(null)
        setActiveQuick('')
      } else {
        // Set end date
        if (isBefore(day, selectingStart)) {
          setSelectingEnd(selectingStart)
          setSelectingStart(day)
        } else {
          setSelectingEnd(day)
        }
      }
    },
    [selectingStart, selectingEnd]
  )

  const handleApply = useCallback(() => {
    if (selectingStart && selectingEnd) {
      onChange({
        start: startOfDay(selectingStart),
        end: endOfDay(selectingEnd),
      })
      setActiveQuick('')
      setOpen(false)
    }
  }, [selectingStart, selectingEnd, onChange])

  const handleCancel = useCallback(() => {
    setSelectingStart(null)
    setSelectingEnd(null)
    setOpen(false)
  }, [])

  const prevMonth = subMonths(calendarMonth, 1)

  // Format the trigger label
  const formatTrigger = () => {
    const s = format(value.start, 'd MMM', { locale: fr })
    const e = format(value.end, 'd MMM yyyy', { locale: fr })
    if (isSameDay(value.start, value.end)) {
      return format(value.start, 'd MMMM yyyy', { locale: fr })
    }
    return `${s} – ${e}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="capitalize">{formatTrigger()}</span>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl flex overflow-hidden max-w-[90vw]">
          {/* Quick periods */}
          <div className="w-52 border-r border-gray-100 py-2 max-h-[400px] overflow-y-auto">
            {quickPeriods.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleQuickSelect(p)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  activeQuick === p.label
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendars */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                disabled={isSameMonth(calendarMonth, new Date())}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex gap-6">
              <CalendarMonth
                month={prevMonth}
                rangeStart={selectingStart || value.start}
                rangeEnd={selectingEnd || (selectingStart ? null : value.end)}
                hoveredDate={selectingStart && !selectingEnd ? hoveredDate : null}
                onDateClick={handleDateClick}
                onDateHover={setHoveredDate}
              />
              <CalendarMonth
                month={calendarMonth}
                rangeStart={selectingStart || value.start}
                rangeEnd={selectingEnd || (selectingStart ? null : value.end)}
                hoveredDate={selectingStart && !selectingEnd ? hoveredDate : null}
                onDateClick={handleDateClick}
                onDateHover={setHoveredDate}
              />
            </div>

            {/* Selection info + buttons */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {selectingStart && !selectingEnd && (
                  <span>Sélectionnez une date de fin</span>
                )}
                {selectingStart && selectingEnd && (
                  <span className="text-blue-600 font-medium">
                    {format(selectingStart, 'd MMM', { locale: fr })} – {format(selectingEnd, 'd MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!selectingStart || !selectingEnd}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
