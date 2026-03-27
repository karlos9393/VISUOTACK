import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CrmTrackerPage } from '@/components/crm-tracker/CrmTrackerPage'

export const dynamic = 'force-dynamic'

export default async function CrmTrackerRoute() {
  const supabase = createClient()
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

  const isAdmin = ['admin', 'manager'].includes(profile.role)

  // Liste des setters (admin uniquement)
  let setters = [{ id: profile.id, full_name: profile.full_name, email: profile.email, role: profile.role }]
  if (isAdmin) {
    const { data } = await adminClient
      .from('users')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })
    if (data) setters = data
  }

  // Mois courant
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Entrées du mois
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  const { data: entries } = await supabase
    .from('crm_daily_entries')
    .select('*')
    .eq('setter_id', profile.id)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })

  return (
    <CrmTrackerPage
      currentUserId={profile.id}
      currentUserRole={profile.role}
      setters={setters}
      initialEntries={entries || []}
      initialYear={year}
      initialMonth={month}
    />
  )
}
