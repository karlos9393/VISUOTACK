import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, subDays } from 'date-fns'
import { PipelineView } from '@/components/pipeline/PipelineView'
import { CrmPipelineTable } from '@/components/crm-tracker/CrmPipelineTable'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const now = new Date()

  // Charger les 90 derniers jours de logs — le client filtre par période
  const since = format(subDays(now, 90), 'yyyy-MM-dd')

  // Auth + profil
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await adminClient.from('users').select('id, full_name, email, role').eq('id', user.id).single()
    : { data: null }

  const isAdmin = profile && ['admin', 'manager'].includes(profile.role)

  const [logsRes, crmRes, settersRes] = await Promise.all([
    supabase
      .from('setter_logs')
      .select('*, users(full_name, email)')
      .gte('date', since)
      .order('date', { ascending: false }),
    profile
      ? supabase
          .from('crm_daily_entries')
          .select('*')
          .eq('setter_id', profile.id)
          .gte('date', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
          .order('date', { ascending: true })
      : Promise.resolve({ data: [] }),
    isAdmin
      ? adminClient.from('users').select('id, full_name, email, role').order('full_name', { ascending: true })
      : Promise.resolve({ data: null }),
  ])

  const logs = logsRes.data
  const crmEntries = crmRes.data || []
  const setters = settersRes.data || (profile ? [profile] : [])

  // Vérifier qui a rempli aujourd'hui
  const todayStr = format(now, 'yyyy-MM-dd')
  const allLogs = logs || []
  const todayLogs = allLogs.filter((l) => l.date === todayStr)
  const todayFilledBy = todayLogs
    .map((l) => (l as { users?: { full_name?: string } }).users?.full_name)
    .filter((n): n is string => Boolean(n))

  return (
    <div className="space-y-10">
      <PipelineView
        allLogs={logs || []}
        hasTodayLog={todayLogs.length > 0}
        todayFilledBy={todayFilledBy}
      />

      {profile && (
        <CrmPipelineTable
          currentUserId={profile.id}
          currentUserRole={profile.role}
          setters={setters}
          initialEntries={crmEntries}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth() + 1}
        />
      )}
    </div>
  )
}
