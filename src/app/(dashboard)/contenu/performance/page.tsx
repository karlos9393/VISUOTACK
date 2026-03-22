import { createClient } from '@/lib/supabase/server'
import { PerformanceDashboard } from '@/components/contenu/performance-dashboard'
import { getAccountStats, getMediaList } from '@/lib/services/instagram'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Charger les données côté serveur (accès direct aux env vars)
  const [accountStats, mediaList] = await Promise.all([
    getAccountStats(),
    getMediaList(),
  ])

  const tokenExpired = !accountStats && !mediaList.length

  return (
    <PerformanceDashboard
      initialAccountStats={accountStats}
      initialMedia={mediaList}
      initialTokenExpired={tokenExpired}
    />
  )
}
