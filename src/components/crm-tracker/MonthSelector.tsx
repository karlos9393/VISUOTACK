'use client'

import { format, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MonthSelectorProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthSelector({ year, month, onChange }: MonthSelectorProps) {
  const current = new Date(year, month - 1, 1)
  const label = format(current, 'MMMM yyyy', { locale: fr })

  function goPrev() {
    const prev = subMonths(current, 1)
    onChange(prev.getFullYear(), prev.getMonth() + 1)
  }

  function goNext() {
    const next = addMonths(current, 1)
    onChange(next.getFullYear(), next.getMonth() + 1)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goPrev}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="text-lg font-semibold text-gray-900 capitalize min-w-[180px] text-center">
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
