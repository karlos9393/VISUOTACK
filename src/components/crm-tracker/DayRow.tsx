'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { UserInitials } from './UserInitials'
import { KPI_DEFS, computeKpiValue, getKpiColor, formatKpi } from '@/lib/crm-kpi'

export interface DayData {
  date: string
  conversations_entrantes: number
  outbound_envoyes: number
  reponses_outbound: number
  fup_envoyes: number
  reponses_fup: number
  liens_rdv_envoyes: number
  rdv_bookes: number
  rdv_qualifies: number
  setter_present: boolean
  notes: string | null
  filled: boolean
  updater?: { full_name: string | null; email: string } | null
  updated_at?: string
}

// Colonnes entières éditables, dans l'ordre d'affichage.
export const EDITABLE_COLS: (keyof DayData)[] = [
  'conversations_entrantes',
  'outbound_envoyes',
  'reponses_outbound',
  'fup_envoyes',
  'reponses_fup',
  'liens_rdv_envoyes',
  'rdv_bookes',
  'rdv_qualifies',
]

interface DayRowProps {
  day: DayData
  weekLabel?: string
  readOnly?: boolean
  showParColumn?: boolean
  onCellChange: (date: string, field: string, value: number) => void
}

export function DayRow({ day, weekLabel, readOnly = false, showParColumn = false, onCellChange }: DayRowProps) {
  const dateObj = new Date(day.date + 'T00:00:00')
  const dayName = format(dateObj, 'EEE', { locale: fr })
  const dateDisplay = format(dateObj, 'dd/MM', { locale: fr })

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-3 py-2 text-xs font-medium text-gray-500 w-24">
        {weekLabel || ''}
      </td>
      <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
        <span className="capitalize">{dayName}</span>{' '}
        <span className="text-gray-400">{dateDisplay}</span>
        {day.notes && (
          <span
            className="ml-1.5 cursor-help align-middle text-gray-400"
            title={day.notes}
            aria-label={`Notes : ${day.notes}`}
          >
            🗒️
          </span>
        )}
      </td>

      {EDITABLE_COLS.map((field) => (
        <EditableCell
          key={field}
          field={field}
          value={day[field] as number}
          date={day.date}
          readOnly={readOnly}
          onChange={onCellChange}
        />
      ))}

      {/* PRÉSENT */}
      <td className="px-2 py-2 text-center text-sm">
        {!day.filled ? (
          <span className="text-gray-300">&mdash;</span>
        ) : day.setter_present ? (
          <span className="text-green-600 font-bold" title="Présent">✓</span>
        ) : (
          <span className="text-red-500 font-bold" title="Absent">✗</span>
        )}
      </td>

      {/* PAR */}
      {showParColumn && (
        day.updater ? (
          <UserInitials
            fullName={day.updater.full_name}
            email={day.updater.email}
            updatedAt={day.updated_at || ''}
          />
        ) : (
          <td className="px-2 py-2 text-center text-gray-300 text-xs">&mdash;</td>
        )
      )}

      <td className="w-2" />

      {KPI_DEFS.map((def) => {
        const value = computeKpiValue(def.key, day)
        return <MetricCell key={def.key} value={formatKpi(value)} color={getKpiColor(def.key, value)} />
      })}
    </tr>
  )
}

function EditableCell({
  field,
  value,
  date,
  readOnly,
  onChange,
}: {
  field: string
  value: number
  date: string
  readOnly: boolean
  onChange: (date: string, field: string, value: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [localValue, setLocalValue] = useState(String(value))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClick() {
    if (readOnly) return
    setLocalValue(value === 0 ? '' : String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function handleBlur() {
    const newVal = localValue === '' ? 0 : Math.max(0, parseInt(localValue) || 0)
    setEditing(false)
    if (newVal !== value) {
      setSaving(true)
      try {
        await onChange(date, field, newVal)
      } finally {
        setSaving(false)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setLocalValue(value === 0 ? '' : String(value))
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <td className="px-1 py-1">
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-16 px-2 py-1 text-sm text-center border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
      </td>
    )
  }

  return (
    <td
      className={cn(
        'px-3 py-2 text-sm text-center',
        readOnly
          ? 'text-gray-700'
          : 'text-gray-900 cursor-pointer hover:bg-primary-soft rounded transition-colors'
      )}
      onClick={handleClick}
    >
      {saving ? (
        <span className="text-primary text-xs">...</span>
      ) : (
        value === 0 ? '' : value
      )}
    </td>
  )
}

function MetricCell({ value, color }: { value: string; color: string }) {
  const isDash = value === '—'
  return (
    <td
      className="px-3 py-2 text-sm text-center font-medium"
      style={!isDash && color ? { backgroundColor: color, color: '#000' } : undefined}
    >
      <span className={isDash ? 'text-gray-300' : ''}>{value}</span>
    </td>
  )
}
