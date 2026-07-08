import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { getTokenStatus, TOKEN_EXPIRY_CONFIG_KEY } from '@/lib/services/instagram'
import { TokenExpiryAlertEmail } from '@/lib/email-templates'

// Seuil d'alerte : prévenir 7 jours avant l'expiration
const ALERT_THRESHOLD_DAYS = 7

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const status = await getTokenStatus()
  const supabase = createAdminClient()

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
    return NextResponse.json({ alert_sent: false, message: 'Token permanent, OK' })
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
    invalid,
    days_remaining: status.daysRemaining,
    email_error: error?.message,
  })
}
