import { PerformanceDashboard } from '@/components/contenu/performance-dashboard'
import { getAccountStats, getMediaList } from '@/lib/services/instagram'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const user = await getSessionUser()
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
