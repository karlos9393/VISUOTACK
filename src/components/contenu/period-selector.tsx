'use client'

export type PeriodKey = 'today' | '3d' | '7d' | '14d' | '30d' | 'custom'

interface PeriodSelectorProps {
  selected: PeriodKey
  onSelect: (key: PeriodKey) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
  compareEnabled: boolean
  onCompareToggle: () => void
}

const periods: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '3d', label: '3 jours' },
  { key: '7d', label: '7 jours' },
  { key: '14d', label: '14 jours' },
  { key: '30d', label: '30 jours' },
  { key: 'custom', label: 'Personnalisé' },
]

export function PeriodSelector({
  selected,
  onSelect,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  compareEnabled,
  onCompareToggle,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5 flex-wrap">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selected === p.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="px-2 py-1.5 text-sm border rounded-md"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="px-2 py-1.5 text-sm border rounded-md"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={onCompareToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500" />
        </label>
        <span className="text-sm text-gray-600">Comparer</span>
      </div>
    </div>
  )
}
