'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Vérifie que l'utilisateur courant est admin. Retourne l'user id ou null. */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user.id : null
}

export interface ScriptCatalogItem {
  id: string
  partie: string
  semaine: string
  semaine_label: string
  titre: string
  contenu: string
}

export interface PostScriptLink {
  media_id: string
  script_id: string | null
  script_override: string | null
}

/** Catalogue complet des scripts (les 184). Lecture seule — la source n'est jamais modifiée. */
export async function getScriptsCatalog(): Promise<ScriptCatalogItem[]> {
  const adminId = await requireAdmin()
  if (!adminId) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('generateur_scripts')
    .select('id, partie, semaine, semaine_label, titre, contenu')

  const rows = (data as Record<string, unknown>[]) || []

  return rows
    .map((r) => ({
      id: String(r.id ?? ''),
      partie: String(r.partie ?? ''),
      semaine: String(r.semaine ?? ''),
      semaine_label: String(r.semaine_label ?? ''),
      titre: String(r.titre ?? ''),
      contenu: String(r.contenu ?? ''),
    }))
    .sort(
      (a, b) =>
        (Number(a.partie) || 0) - (Number(b.partie) || 0) ||
        (Number(a.semaine) || 0) - (Number(b.semaine) || 0) ||
        (Number(a.id) || 0) - (Number(b.id) || 0)
    )
}

/** Tous les liens post <-> script (pour les badges et l'état initial). */
export async function getAllLinks(): Promise<PostScriptLink[]> {
  const adminId = await requireAdmin()
  if (!adminId) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('post_script_links')
    .select('media_id, script_id, script_override')

  return (data as PostScriptLink[]) || []
}

/** Associe un script à un post (upsert 1-1). Réinitialise l'override → charge la source fraîche. */
export async function linkScript(mediaId: string, scriptId: string) {
  const adminId = await requireAdmin()
  if (!adminId) return { error: 'Accès refusé' }
  if (!mediaId || !scriptId) return { error: 'Paramètres manquants' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('post_script_links')
    .upsert(
      {
        media_id: mediaId,
        script_id: scriptId,
        script_override: null,
        linked_at: new Date().toISOString(),
      },
      { onConflict: 'media_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

/** Dissocie le script d'un post (supprime la ligne de liaison, pas le script source). */
export async function unlinkScript(mediaId: string) {
  const adminId = await requireAdmin()
  if (!adminId) return { error: 'Accès refusé' }
  if (!mediaId) return { error: 'media_id manquant' }

  const admin = createAdminClient()
  const { error } = await admin.from('post_script_links').delete().eq('media_id', mediaId)

  if (error) return { error: error.message }
  return { success: true }
}

/** Sauvegarde le texte édité par-post dans script_override (jamais dans la source). */
export async function saveOverride(mediaId: string, text: string) {
  const adminId = await requireAdmin()
  if (!adminId) return { error: 'Accès refusé' }
  if (!mediaId) return { error: 'media_id manquant' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('post_script_links')
    .update({ script_override: text })
    .eq('media_id', mediaId)

  if (error) return { error: error.message }
  return { success: true }
}
