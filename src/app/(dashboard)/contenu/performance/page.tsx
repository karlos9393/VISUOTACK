import { createClient } from '@/lib/supabase/server'
import { PerformanceDashboard } from '@/components/contenu/performance-dashboard'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return <PerformanceDashboard />
}
