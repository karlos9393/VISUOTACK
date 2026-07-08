import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import {
  getTokenStatus,
  debugToken,
  invalidateTokenCache,
  TOKEN_CONFIG_KEY,
  TOKEN_EXPIRY_CONFIG_KEY,
} from '@/lib/services/instagram'
import { TokenExpiryAlertEmail } from '@/lib/email-templates'

// Seuil d'alerte : prévenir 7 jours avant l'expiration
const ALERT_THRESHOLD_DAYS = 7

/**
 * Auto-réparation : si le token stocké en base (app_config) est invalide mais que
 * la variable d'env est, elle, valide, on vide la base pour que getToken() retombe
 * sur l'env. Évite qu'un vieux token en DB masque un bon token en env.
 * Retourne true si une réparation a eu lieu.
 */
async function selfHeal(supabase: ReturnType<typeof createAdminClient>): Promise<boolean> {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', TOKEN_CONFIG_KEY)
    .single()

  const dbToken = data?.value?.trim() || ''
  if (!dbToken) return false // rien en base → déjà sur l'env

  const dbStatus = await debugToken(dbToken)
  if (dbStatus.valid) return false // token DB valide → rien à faire

  const envToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() || ''
  if (!envToken || envToken === dbToken) return false // pas de meilleur candidat

  const envStatus = await debugToken(envToken)
  if (!envStatus.valid) return false // l'env n'est pas meilleur → on ne touche à rien

  // DB invalide + env valide → on vide la DB pour repasser sur l'env
  await supabase
    .from('app_config')
    .update({ value: '', updated_at: new Date().toISOString() })
    .eq('key', TOKEN_CONFIG_KEY)
  invalidateTokenCache()
  return true
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  const healed = await selfHeal(supabase)
  const status = await getTokenStatus()

  // Garder la date d'expiration à jour dans app_config (pour l'UI admin)
  await supabase.from('app_config').upsert(
    {
      key: TOKEN_EXPIRY_CONFIG_KEY,
      value: status.neverExpires ? 'never' : (status.expiresAt || ''),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  // Token permanent et valide → rien à signaler
  if (status.valid && status.neverExpires) {
    return NextResponse.json({ alert_sent: false, healed, message: 'Token permanent, OK' })
  }

  const invalid = !status.valid
  const nearExpiry =
    status.valid &&
    !status.neverExpires &&
    status.daysRemaining != null &&
    status.daysRemaining <= ALERT_THRESHOLD_DAYS

  if (!invalid && !nearExpiry) {
    return NextResponse.json({
      alert_sent: false,
      healed,
      valid: status.valid,
      days_remaining: status.daysRemaining,
    })
  }

  // Envoyer l'alerte email à l'admin
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'CYGA <noreply@cyga.co>',
    to: process.env.ADMIN_EMAIL!,
    subject: invalid
      ? 'ALERTE — Token Instagram invalide'
      : `Token Instagram expire dans ${status.daysRemaining} jour(s)`,
    react: TokenExpiryAlertEmail({
      daysRemaining: status.daysRemaining,
      expiresAt: status.expiresAt,
      invalid,
    }),
  })

  return NextResponse.json({
    alert_sent: true,
    healed,
    invalid,
    days_remaining: status.daysRemaining,
    email_error: error?.message,
  })
}
