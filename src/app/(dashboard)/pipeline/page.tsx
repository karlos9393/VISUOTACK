import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import { PipelineView } from '@/components/pipeline/PipelineView'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = createClient()
  const now = new Date()

  // Charger les 90 derniers jours de logs — le client filtre par période
  const since = format(subDays(now, 90), 'yyyy-MM-dd')

  const { data: logs } = await supabase
    .from('setter_logs')
    .select('*, users(full_name, email)')
    .gte('date', since)
    .order('date', { ascending: false })

  // Vérifier qui a rempli aujourd'hui
  const todayStr = format(now, 'yyyy-MM-dd')
  const allLogs = logs || []
  const todayLogs = allLogs.filter((l) => l.date === todayStr)
  const todayFilledBy = todayLogs
    .map((l) => (l as { users?: { full_name?: string } }).users?.full_name)
    .filter((n): n is string => Boolean(n))

  return (
    <PipelineView
      allLogs={logs || []}
      hasTodayLog={todayLogs.length > 0}
      todayFilledBy={todayFilledBy}
    />
  )
}
