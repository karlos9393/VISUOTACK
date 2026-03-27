'use client'

import { cn } from '@/lib/utils'
import type { DayData } from './DayRow'

interface TotalRowProps {
  days: DayData[]
  label: string
}

function average(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

function calcWeekTotals(days: DayData[]) {
  const messages_envoyes = days.reduce((s, d) => s + d.messages_envoyes, 0)
  const reponses = days.reduce((s, d) => s + d.reponses, 0)
  const fup_envoyes = days.reduce((s, d) => s + d.fup_envoyes, 0)
  const reponses_fup = days.reduce((s, d) => s + d.reponses_fup, 0)
  const rdv_bookes = days.reduce((s, d) => s + d.rdv_bookes, 0)

  const avg_pct_reponse = average(
    days.map(d => d.messages_envoyes > 0 ? d.reponses / d.messages_envoyes * 100 : null)
  )
  const avg_pct_reponse_fup = average(
    days.map(d => d.fup_envoyes > 0 ? d.reponses_fup / d.fup_envoyes * 100 : null)
  )
  const avg_pct_rdv_message = average(
    days.map(d => d.messages_envoyes > 0 ? d.rdv_bookes / d.messages_envoyes * 100 : null)
  )
  const avg_pct_rdv_reponse = average(
    days.map(d => (d.reponses + d.reponses_fup) > 0 ? d.rdv_bookes / (d.reponses + d.reponses_fup) * 100 : null)
  )

  return {
    messages_envoyes,
    reponses,
    fup_envoyes,
    reponses_fup,
    rdv_bookes,
    avg_pct_reponse,
    avg_pct_reponse_fup,
    avg_pct_rdv_message,
    avg_pct_rdv_reponse,
  }
}

function formatPct(val: number | null): string {
  if (val === null) return '\u2014'
  return val.toFixed(1) + '%'
}

export function TotalRow({ days, label }: TotalRowProps) {
  const totals = calcWeekTotals(days)

  return (
    <tr className="bg-gray-100 border-b-2 border-gray-300 font-semibold">
      <td className="px-3 py-2.5 text-xs text-gray-600">{label}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500">Total</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.messages_envoyes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.reponses}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.fup_envoyes}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.reponses_fup}</td>
      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{totals.rdv_bookes}</td>
      <td className="w-2" />
      <TotalMetricCell value={formatPct(totals.avg_pct_reponse)} />
      <TotalMetricCell value={formatPct(totals.avg_pct_reponse_fup)} />
      <TotalMetricCell value={formatPct(totals.avg_pct_rdv_message)} />
      <TotalMetricCell value={formatPct(totals.avg_pct_rdv_reponse)} />
    </tr>
  )
}

function TotalMetricCell({ value }: { value: string }) {
  const isDash = value === '\u2014'
  return (
    <td className={cn(
      'px-3 py-2.5 text-sm text-center',
      isDash ? 'text-gray-300' : 'text-blue-800 bg-blue-100/60'
    )}>
      {value}
    </td>
  )
}

// Export for reuse in KPI cards
export { calcWeekTotals, average }
