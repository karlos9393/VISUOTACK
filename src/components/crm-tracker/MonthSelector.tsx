'use client'

import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  startOfWeek, endOfWeek, isSameMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'

type ViewMode = 'week' | 'month'

interface PeriodSelectorProps {
  viewMode: ViewMode
  /** En mode month : 1er du mois. En mode week : n'importe quel jour de la semaine. */
  currentDate: Date
  onNavigate: (newDate: Date) => void
}

function formatWeekLabel(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })

  if (isSameMonth(start, end)) {
    return `Lun. ${format(start, 'd')} \u2192 Dim. ${format(end, 'd MMM yyyy', { locale: fr })}`
  }
  return `Lun. ${format(start, 'd MMM', { locale: fr })} \u2192 Dim. ${format(end, 'd MMM yyyy', { locale: fr })}`
}

export function PeriodSelector({ viewMode, currentDate, onNavigate }: PeriodSelectorProps) {
  const label = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy', { locale: fr })
    : formatWeekLabel(currentDate)

  function goPrev() {
    if (viewMode === 'month') {
      onNavigate(subMonths(currentDate, 1))
    } else {
      onNavigate(subWeeks(currentDate, 1))
    }
  }

  function goNext() {
    if (viewMode === 'month') {
      onNavigate(addMonths(currentDate, 1))
    } else {
      onNavigate(addWeeks(currentDate, 1))
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goPrev}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="text-sm sm:text-base font-semibold text-gray-900 capitalize min-w-[180px] text-center">
        {label}
      </span>
      <button
        onClick={goNext}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
