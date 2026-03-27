'use client'

import { cn } from '@/lib/utils'

export type ViewMode = 'week' | 'month'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
      <button
        onClick={() => onChange('week')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
          value === 'week'
            ? 'bg-gray-900 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        Semaine
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
          value === 'month'
            ? 'bg-gray-900 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        Mois
      </button>
    </div>
  )
}
