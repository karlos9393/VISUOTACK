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
    .select('*')
    .gte('date', since)
    .order('date', { ascending: false })

  // Vérifier si le setter a rempli aujourd'hui
  const todayStr = format(now, 'yyyy-MM-dd')
  const hasTodayLog = (logs || []).some((l) => l.date === todayStr)

  return (
    <PipelineView
      allLogs={logs || []}
      hasTodayLog={hasTodayLog}
    />
  )
}
