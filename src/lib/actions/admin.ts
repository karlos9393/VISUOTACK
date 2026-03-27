'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

  // Récupérer l'ancien rôle pour l'audit
  const { data: target } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  const { error } = await supabase
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
