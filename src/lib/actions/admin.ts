'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  debugToken,
  invalidateTokenCache,
  TOKEN_CONFIG_KEY,
  TOKEN_EXPIRY_CONFIG_KEY,
} from '@/lib/services/instagram'

async function logAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
) {
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    })
  } catch {
    // Ne pas bloquer l'action si l'audit échoue
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que l'utilisateur courant est admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Accès refusé' }

  if (!['admin', 'manager', 'setter'].includes(newRole)) {
    return { error: 'Rôle invalide' }
  }

  // Utiliser adminClient pour bypass RLS (l'admin ne peut pas update les autres via RLS)
  const admin = createAdminClient()

  // Récupérer l'ancien rôle pour l'audit
  const { data: target } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  const { error } = await admin
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  await logAudit(user.id, 'update_role', 'user', userId, {
    old_role: target?.role,
    new_role: newRole,
  })

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Met à jour le token Instagram (System User / long-lived) sans redéploiement.
 * Valide le token via /debug_token avant de l'enregistrer dans app_config.
 * Réservé aux admins.
 */
export async function updateInstagramToken(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Accès refusé' }

  const clean = token.trim()
  if (!clean) return { error: 'Token vide' }

  // Valider le token AVANT de l'enregistrer
  const status = await debugToken(clean)
  if (!status.valid) {
    return { error: `Token invalide : ${status.error || 'refusé par Meta'}` }
  }

  const expiryValue = status.neverExpires ? 'never' : (status.expiresAt || '')

  const admin = createAdminClient()
  const { error } = await admin.from('app_config').upsert(
    [
      { key: TOKEN_CONFIG_KEY, value: clean, updated_at: new Date().toISOString() },
      { key: TOKEN_EXPIRY_CONFIG_KEY, value: expiryValue, updated_at: new Date().toISOString() },
    ],
    { onConflict: 'key' }
  )

  if (error) return { error: error.message }

  invalidateTokenCache()

  await logAudit(user.id, 'update_instagram_token', 'app_config', TOKEN_CONFIG_KEY, {
    never_expires: status.neverExpires,
    expires_at: expiryValue,
    type: status.type,
  })

  revalidatePath('/admin')
  revalidatePath('/contenu/performance')
  return {
    success: true,
    neverExpires: status.neverExpires,
    expiresAt: status.expiresAt,
    daysRemaining: status.daysRemaining,
    type: status.type,
  }
}
