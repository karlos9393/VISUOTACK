import { createClient } from '@/lib/supabase/server'
import { getMediaList } from '@/lib/services/instagram'
import { getAllLinks, getAllNotes } from '@/lib/actions/generateur'
import { GenerateurDashboard } from '@/components/contenu/generateur-dashboard'

export const dynamic = 'force-dynamic'

export default async function GenerateurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Même source que /contenu/performance — on réutilise le service Instagram existant
  const [media, links, notes] = await Promise.all([getMediaList(), getAllLinks(), getAllNotes()])
  const tokenExpired = media.length === 0

  return (
    <GenerateurDashboard
      initialMedia={media}
      tokenExpired={tokenExpired}
      initialLinks={links}
      initialNotes={notes}
    />
  )
}
