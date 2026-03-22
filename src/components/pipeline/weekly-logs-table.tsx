import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DayLog {
  date: string
  dayName: string
  log: {
    conversations: number
    qualified: number
    links_sent: number
    calls_booked: number
    calls_shown: number
    closes: number
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
    calls_shown: number
    closes: number
  }
}

export function WeeklyLogsTable({ dayLogs, totals }: WeeklyLogsTableProps) {
  return (
    <Card>
      <CardTitle>Log quotidien</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">Jour</th>
              <th className="pb-3 px-2 font-medium text-center">Conv.</th>
              <th className="pb-3 px-2 font-medium text-center">Qualifiés</th>
              <th className="pb-3 px-2 font-medium text-center">Liens</th>
              <th className="pb-3 px-2 font-medium text-center">Bookés</th>
              <th className="pb-3 px-2 font-medium text-center">Honorés</th>
              <th className="pb-3 px-2 font-medium text-center">Closes</th>
            </tr>
          </thead>
          <tbody>
            {dayLogs.map((day) => (
              <tr key={day.date} className="border-b last:border-0">
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
                <td className="py-3 px-2 text-center">{day.log?.calls_shown ?? '-'}</td>
                <td className="py-3 px-2 text-center">{day.log?.closes ?? '-'}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="py-3 pr-4">TOTAL</td>
              <td className="py-3 px-2 text-center">{totals.conversations}</td>
              <td className="py-3 px-2 text-center">{totals.qualified}</td>
              <td className="py-3 px-2 text-center">{totals.links_sent}</td>
              <td className="py-3 px-2 text-center">{totals.calls_booked}</td>
              <td className="py-3 px-2 text-center">{totals.calls_shown}</td>
              <td className="py-3 px-2 text-center">{totals.closes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
