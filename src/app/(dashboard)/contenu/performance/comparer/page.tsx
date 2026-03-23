import { createClient } from '@/lib/supabase/server'
import { ComparerDashboard } from '@/components/contenu/comparer-dashboard'

export const dynamic = 'force-dynamic'

export default async function ComparerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return <ComparerDashboard />
}
