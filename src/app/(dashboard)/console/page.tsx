import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ConsolePage } from '@/components/console/console-page'
import { CONSOLE_SECTIONS } from '@/lib/console/links'

export const metadata = { title: 'La console · Visuo Track' }

export default async function ConsoleRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return <ConsolePage sections={CONSOLE_SECTIONS} />
}
