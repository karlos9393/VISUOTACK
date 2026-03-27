'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { UserInitials } from './UserInitials'

export interface DayData {
  date: string
  messages_envoyes: number
  reponses: number
  fup_envoyes: number
  reponses_fup: number
  rdv_bookes: number
  updater?: { full_name: string | null; email: string } | null
  updated_at?: string
}

interface DayRowProps {
  day: DayData
  weekLabel?: string
  readOnly?: boolean
  showParColumn?: boolean
  onCellChange: (date: string, field: string, value: number) => void
}

function calcMetrics(row: DayData) {
  return {
    pct_reponse: row.messages_envoyes > 0
      ? (row.reponses / row.messages_envoyes * 100).toFixed(1) + '%'
      : '\u2014',
    pct_reponse_fup: row.fup_envoyes > 0
      ? (row.reponses_fup / row.fup_envoyes * 100).toFixed(1) + '%'
      : '\u2014',
    pct_rdv_message: row.messages_envoyes > 0
      ? (row.rdv_bookes / row.messages_envoyes * 100).toFixed(1) + '%'
      : '\u2014',
    pct_rdv_reponse: (row.reponses + row.reponses_fup) > 0
      ? (row.rdv_bookes / (row.reponses + row.reponses_fup) * 100).toFixed(1) + '%'
      : '\u2014',
  }
}

export function DayRow({ day, weekLabel, readOnly = false, showParColumn = false, onCellChange }: DayRowProps) {
  const metrics = calcMetrics(day)
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
      </td>
      <EditableCell field="messages_envoyes" value={day.messages_envoyes} date={day.date} readOnly={readOnly} onChange={onCellChange} />
      <EditableCell field="reponses" value={day.reponses} date={day.date} readOnly={readOnly} onChange={onCellChange} />
      <EditableCell field="fup_envoyes" value={day.fup_envoyes} date={day.date} readOnly={readOnly} onChange={onCellChange} />
      <EditableCell field="reponses_fup" value={day.reponses_fup} date={day.date} readOnly={readOnly} onChange={onCellChange} />
      <EditableCell field="rdv_bookes" value={day.rdv_bookes} date={day.date} readOnly={readOnly} onChange={onCellChange} />
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
      <MetricCell value={metrics.pct_reponse} />
      <MetricCell value={metrics.pct_reponse_fup} />
      <MetricCell value={metrics.pct_rdv_message} />
      <MetricCell value={metrics.pct_rdv_reponse} />
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
          className="w-16 px-2 py-1 text-sm text-center border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          : 'text-gray-900 cursor-pointer hover:bg-blue-50 rounded transition-colors'
      )}
      onClick={handleClick}
    >
      {saving ? (
        <span className="text-blue-500 text-xs">...</span>
      ) : (
        value === 0 ? '' : value
      )}
    </td>
  )
}

function MetricCell({ value }: { value: string }) {
  const isDash = value === '\u2014'
  return (
    <td className={cn(
      'px-3 py-2 text-sm text-center',
      isDash ? 'text-gray-300' : 'text-blue-700 bg-blue-50/50'
    )}>
      {value}
    </td>
  )
}
