import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { WeeklyReportEmail } from '@/lib/email-templates'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()
  const now = new Date()
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const weekStartStr = format(prevWeekStart, 'yyyy-MM-dd')

  // 1. Agréger setter_logs
  const { data: logs } = await supabase
    .from('setter_logs')
    .select('*')
    .gte('date', format(prevWeekStart, 'yyyy-MM-dd'))
    .lte('date', format(prevWeekEnd, 'yyyy-MM-dd'))

  const weekLogs = logs || []
  const pipeline = weekLogs.reduce(
    (acc, l) => ({
      conversations: acc.conversations + l.conversations,
      qualified: acc.qualified + l.qualified,
      links: acc.links + l.links_sent,
      booked: acc.booked + l.calls_booked,
      shown: acc.shown + l.calls_shown,
      closes: acc.closes + l.closes,
    }),
    { conversations: 0, qualified: 0, links: 0, booked: 0, shown: 0, closes: 0 }
  )

  const closeRate = pipeline.shown > 0 ? Math.round((pipeline.closes / pipeline.shown) * 100) : 0
  const showRate = pipeline.booked > 0 ? Math.round((pipeline.shown / pipeline.booked) * 100) : 0

  // 2. Snapshot contenu
  const { data: snapshot } = await supabase
    .from('content_weekly_snapshots')
    .select('*, content_posts(title)')
    .eq('week_start', weekStartStr)
    .single()

  // 3. Revenue
  const { data: revenues } = await supabase
    .from('revenue_entries')
    .select('amount, offer')
    .gte('date', format(prevWeekStart, 'yyyy-MM-dd'))
    .lte('date', format(prevWeekEnd, 'yyyy-MM-dd'))

  const revData = revenues || []
  const caTotal = revData.reduce((s, r) => s + Number(r.amount), 0)
  const caFormation = revData.filter((r) => r.offer === 'formation').reduce((s, r) => s + Number(r.amount), 0)
  const caAccompagnement = revData.filter((r) => r.offer === 'accompagnement').reduce((s, r) => s + Number(r.amount), 0)
  const caDfy = revData.filter((r) => r.offer === 'dfy').reduce((s, r) => s + Number(r.amount), 0)

  // 4. Insérer le rapport
  const { error: insertError } = await supabase
    .from('weekly_reports')
    .upsert({
      week_start: weekStartStr,
      total_conversations: pipeline.conversations,
      total_qualified: pipeline.qualified,
      total_links: pipeline.links,
      total_booked: pipeline.booked,
      total_shown: pipeline.shown,
      total_closes: pipeline.closes,
      close_rate: closeRate,
      show_rate: showRate,
      posts_published: snapshot?.posts_published || 0,
      total_views: snapshot?.total_views || 0,
      followers_gained: snapshot?.followers_gained || 0,
      best_post_id: snapshot?.best_post_id || null,
      ca_total: caTotal,
      ca_formation: caFormation,
      ca_accompagnement: caAccompagnement,
      ca_dfy: caDfy,
    }, { onConflict: 'week_start' })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 5. Point d'attention
  let attention = 'Bonne semaine — continuer sur cette lancée'
  if (closeRate < 30) attention = 'Taux de close faible cette semaine — revoir le pitch de closing'
  else if (showRate < 50) attention = 'Show rate bas — relancer les no-shows avant le call'
  else if (pipeline.links < 10) attention = "Peu de liens envoyés — vérifier l'activité setter"
  else if ((snapshot?.followers_gained || 0) < 100) attention = 'Croissance faible en abonnés — analyser le contenu'

  // 6. Envoyer l'email
  const emailData = {
    weekStart: format(prevWeekStart, 'dd MMMM yyyy', { locale: fr }),
    conversations: pipeline.conversations,
    closes: pipeline.closes,
    closeRate,
    showRate,
    caWeek: caTotal,
    postsPublished: snapshot?.posts_published || 0,
    totalViews: snapshot?.total_views || 0,
    followersGained: snapshot?.followers_gained || 0,
    bestPostTitle: (snapshot as Record<string, unknown>)?.content_posts
      ? ((snapshot as Record<string, unknown>).content_posts as { title: string })?.title || '-'
      : '-',
    attention,
  }

  const recipients = [process.env.ADMIN_EMAIL!, process.env.MANAGER_EMAIL!].filter(Boolean)

  const { error: emailError } = await resend.emails.send({
    from: 'CYGA <noreply@cyga.co>',
    to: recipients,
    subject: `Rapport CYGA — Semaine du ${emailData.weekStart}`,
    react: WeeklyReportEmail(emailData),
  })

  // Mettre à jour sent_at
  if (!emailError) {
    await supabase
      .from('weekly_reports')
      .update({ sent_at: new Date().toISOString() })
      .eq('week_start', weekStartStr)
  }

  return NextResponse.json({
    message: 'Rapport généré et envoyé',
    email_error: emailError?.message,
  })
}
