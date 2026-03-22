import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { SetterReminderEmail } from '@/lib/email-templates'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Récupérer tous les setters
  const { data: setters } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('role', 'setter')

  if (!setters || setters.length === 0) {
    return NextResponse.json({ message: 'Aucun setter trouvé' })
  }

  const results = []

  for (const setter of setters) {
    // Vérifier si le log existe pour aujourd'hui
    const { data: log } = await supabase
      .from('setter_logs')
      .select('id')
      .eq('user_id', setter.id)
      .eq('date', today)
      .single()

    if (!log) {
      // Envoyer le rappel
      const firstName = setter.full_name?.split(' ')[0] || 'Setter'
      const { error } = await resend.emails.send({
        from: 'CYGA <noreply@cyga.co>',
        to: setter.email,
        subject: 'Log du jour à remplir — CYGA',
        react: SetterReminderEmail({ firstName }),
      })

      results.push({
        setter: setter.email,
        sent: !error,
        error: error?.message,
      })
    }
  }

  return NextResponse.json({ results })
}
