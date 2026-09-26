import { getMediaList } from '@/lib/services/instagram'
import { getAllLinks, getAllNotes, getAllLeads } from '@/lib/actions/generateur'
import { GenerateurDashboard } from '@/components/contenu/generateur-dashboard'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function GenerateurPage() {
  const user = await getSessionUser()
  if (!user) return null

  // Même source que /contenu/performance — on réutilise le service Instagram existant
  const [media, links, notes, leads] = await Promise.all([
    getMediaList(),
    getAllLinks(),
    getAllNotes(),
    getAllLeads(),
  ])
  const tokenExpired = media.length === 0

  return (
    <GenerateurDashboard
      initialMedia={media}
      tokenExpired={tokenExpired}
      initialLinks={links}
      initialNotes={notes}
      initialLeads={leads}
    />
  )
}
