import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { SetterInactiveAlertEmail } from '@/lib/email-templates'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Vérifier les logs du jour
  const { data: logs } = await supabase
    .from('setter_logs')
    .select('conversations, links_sent')
    .eq('date', today)

  // Si pas de log OU conversations=0 ET links_sent=0
  const isInactive = !logs || logs.length === 0 ||
    logs.every((log) => log.conversations === 0 && log.links_sent === 0)

  if (isInactive) {
    const { error } = await resend.emails.send({
      from: 'CYGA <noreply@cyga.co>',
      to: process.env.ADMIN_EMAIL!,
      subject: 'Alerte — Setter inactif aujourd\'hui',
      react: SetterInactiveAlertEmail({ date: today }),
    })

    return NextResponse.json({ alert_sent: true, error: error?.message })
  }

  return NextResponse.json({ alert_sent: false, message: 'Setter actif' })
}
