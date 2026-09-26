import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SessionUser {
  id: string
  email: string | undefined
}

/**
 * Utilisateur de la session, vérifié localement : le JWT est signé en ES256 et
 * getClaims() le valide via la JWKS (mise en cache), sans appel réseau à Supabase Auth.
 * Mémorisé pour la requête : layout, page et actions partagent le même résultat.
 * Limite : une session révoquée reste valide jusqu'à l'expiration du JWT (≤ 1 h) —
 * les actions sensibles (rôles, token IG) gardent auth.getUser().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  return { id: data.claims.sub, email: data.claims.email }
})

/** Profil `users` de l'utilisateur courant, lu une seule fois par requête. */
export const getProfile = cache(async () => {
  const user = await getSessionUser()
  if (!user) return null
  const { data } = await createAdminClient()
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  return data
})
