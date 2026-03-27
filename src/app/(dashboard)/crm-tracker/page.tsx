import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { CrmTrackerPage } from '@/components/crm-tracker/CrmTrackerPage'

export const dynamic = 'force-dynamic'

export default async function CrmTrackerRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Profil courant
  const { data: profile } = await adminClient
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Liste des setters (visible par tous pour naviguer entre les données)
  let setters = [{ id: profile.id, full_name: profile.full_name, email: profile.email, role: profile.role }]
  const { data: allSetters } = await adminClient
    .from('users')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true })
  if (allSetters) setters = allSetters

  // Semaine courante (vue par défaut = week)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const { data: entries } = await supabase
    .from('crm_daily_entries')
    .select('*, updater:updated_by(full_name, email)')
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(weekEnd, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  return (
    <CrmTrackerPage
      currentUserId={profile.id}
      currentUserRole={profile.role}
      setters={setters}
      initialEntries={entries || []}
    />
  )
}
