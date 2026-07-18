'use client'

import type { DayData } from './DayRow'
import { EDITABLE_COLS } from './DayRow'
import { KPI_DEFS, computeKpiValue, getKpiColor, formatKpi, type CrmMetricsInput } from '@/lib/crm-kpi'

interface TotalRowProps {
  days: DayData[]
  label: string
  showParColumn?: boolean
}

// Somme des colonnes brutes sur la période.
function sumColumns(days: DayData[]): CrmMetricsInput & { present: number; filled: number } {
  const acc: CrmMetricsInput & { present: number; filled: number } = {
    conversations_entrantes: 0,
    outbound_envoyes: 0,
    reponses_outbound: 0,
    fup_envoyes: 0,
    reponses_fup: 0,
    liens_rdv_envoyes: 0,
    rdv_bookes: 0,
    rdv_qualifies: 0,
    present: 0,
    filled: 0,
  }
  for (const d of days) {
    for (const col of EDITABLE_COLS) {
      acc[col as keyof CrmMetricsInput] += d[col] as number
    }
    if (d.filled) {
      acc.filled += 1
      if (d.setter_present) acc.present += 1
    }
  }
  return acc
}

export function TotalRow({ days, label, showParColumn = false }: TotalRowProps) {
  const totals = sumColumns(days)

  return (
    <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
      <td className="px-3 py-2.5 text-xs text-gray-600">{label}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">Total</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.conversations_entrantes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.outbound_envoyes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.reponses_outbound}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.fup_envoyes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.reponses_fup}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.liens_rdv_envoyes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.rdv_bookes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.rdv_qualifies}</td>
      {/* PRÉSENT : nombre de jours présents / jours saisis */}
      <td className="px-2 py-2.5 text-xs text-center text-gray-500">
        {totals.filled > 0 ? `${totals.present}/${totals.filled}` : '—'}
      </td>
      {showParColumn && <td />}
      <td className="w-2" />
      {KPI_DEFS.map((def) => {
        const value = computeKpiValue(def.key, totals)
        return <TotalMetricCell key={def.key} value={formatKpi(value)} color={getKpiColor(def.key, value)} />
      })}
    </tr>
  )
}

function TotalMetricCell({ value, color }: { value: string; color: string }) {
  const isDash = value === '—'
  return (
    <td
      className="px-3 py-2.5 text-sm text-center font-bold"
      style={!isDash && color ? { backgroundColor: color, color: '#000' } : undefined}
    >
      <span className={isDash ? 'text-gray-300 font-normal' : ''}>{value}</span>
    </td>
  )
}
