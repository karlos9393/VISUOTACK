'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { updateSetterLogInline } from '@/lib/actions/setter-logs'

interface DayLog {
  date: string
  dayName: string
  log: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
  } | null | undefined
  isFuture: boolean
}

interface WeeklyLogsTableProps {
  dayLogs: DayLog[]
  totals: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
  }
}

export function WeeklyLogsTable({ dayLogs, totals }: WeeklyLogsTableProps) {
  return (
    <Card>
      <CardTitle>Sessions quotidiennes</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">Jour</th>
              <th className="pb-3 px-2 font-medium text-center">Conv.</th>
              <th className="pb-3 px-2 font-medium text-center">Qualifiés</th>
              <th className="pb-3 px-2 font-medium text-center">Liens</th>
              <th className="pb-3 px-2 font-medium text-center">Bookés</th>
              <th className="pb-3 pl-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {dayLogs.map((day) => (
              <DayRow key={day.date} day={day} />
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="py-3 pr-4">TOTAL</td>
              <td className="py-3 px-2 text-center">{totals.conversations}</td>
              <td className="py-3 px-2 text-center">{totals.qualified}</td>
              <td className="py-3 px-2 text-center">{totals.links_sent}</td>
              <td className="py-3 px-2 text-center">{totals.calls_booked}</td>
              <td className="py-3 pl-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function DayRow({ day }: { day: DayLog }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSave(formData: FormData) {
    setLoading(true)
    const result = await updateSetterLogInline(day.date, formData)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Session mise à jour', 'success')
    setEditing(false)
  }

  if (editing && day.log) {
    return (
      <tr className="border-b bg-blue-50">
        <td className="py-2 pr-4 capitalize">{day.dayName}</td>
        <td colSpan={4} className="py-2 px-2">
          <form action={handleSave} className="flex items-center gap-2">
            <input name="conversations" type="number" defaultValue={day.log.conversations} className="w-16 px-2 py-1 border rounded text-center text-sm" />
            <input name="qualified" type="number" defaultValue={day.log.qualified} className="w-16 px-2 py-1 border rounded text-center text-sm" />
            <input name="links_sent" type="number" defaultValue={day.log.links_sent} className="w-16 px-2 py-1 border rounded text-center text-sm" />
            <input name="calls_booked" type="number" defaultValue={day.log.calls_booked} className="w-16 px-2 py-1 border rounded text-center text-sm" />
            <Button size="sm" type="submit" disabled={loading}>OK</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>X</Button>
          </form>
        </td>
        <td></td>
      </tr>
    )
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 capitalize">
        <span className="flex items-center gap-2">
          {day.dayName}
          {!day.log && !day.isFuture && (
            <Badge className="bg-red-100 text-red-700">Non rempli</Badge>
          )}
        </span>
      </td>
      <td className="py-3 px-2 text-center">{day.log?.conversations ?? '-'}</td>
      <td className="py-3 px-2 text-center">{day.log?.qualified ?? '-'}</td>
      <td className="py-3 px-2 text-center">{day.log?.links_sent ?? '-'}</td>
      <td className="py-3 px-2 text-center">{day.log?.calls_booked ?? '-'}</td>
      <td className="py-3 pl-2">
        {day.log && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Modifier
          </button>
        )}
      </td>
    </tr>
  )
}
