'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const periods = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: '4weeks', label: '4 semaines' },
] as const

export type PeriodKey = (typeof periods)[number]['key']

export function PeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = (searchParams.get('period') as PeriodKey) || 'week'

  function select(key: PeriodKey) {
    const params = new URLSearchParams()
    params.set('period', key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => select(p.key)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            current === p.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
