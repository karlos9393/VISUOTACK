import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { CrmTrackerPage } from '@/components/crm-tracker/CrmTrackerPage'

export const dynamic = 'force-dynamic'

export default async function CrmTrackerRoute() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Semaine courante (vue par défaut = week)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Lecture partagée : via le client admin pour que tout utilisateur connecté
  // voie les mêmes données (indépendant de la RLS / du rôle).
  const { data: entries } = await adminClient
    .from('crm_daily_entries')
    .select('*, updater:updated_by(full_name, email)')
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(weekEnd, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  return (
    <CrmTrackerPage
      currentUserId={user.id}
      initialEntries={entries || []}
    />
  )
}
