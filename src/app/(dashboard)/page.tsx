import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Role } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as Role
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const today = format(now, 'yyyy-MM-dd')

  if (role === 'setter') {
    return <SetterHome userId={user.id} today={today} weekStart={format(weekStart, 'yyyy-MM-dd')} weekEnd={format(weekEnd, 'yyyy-MM-dd')} />
  }

  return <ManagerHome role={role} weekStart={format(weekStart, 'yyyy-MM-dd')} weekEnd={format(weekEnd, 'yyyy-MM-dd')} today={today} />
}

async function SetterHome({ userId, today, weekStart, weekEnd }: { userId: string; today: string; weekStart: string; weekEnd: string }) {
  const supabase = createClient()

  // Log du jour
  const { data: todayLog } = await supabase
    .from('setter_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  // Stats de la semaine
  const { data: weekLogs } = await supabase
    .from('setter_logs')
    .select('conversations, links_sent, closes')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  const stats = (weekLogs || []).reduce(
    (acc, l) => ({
      conversations: acc.conversations + l.conversations,
      links: acc.links + l.links_sent,
      closes: acc.closes + l.closes,
    }),
    { conversations: 0, links: 0, closes: 0 }
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bonjour</h1>

      <Card className={todayLog ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              Log du jour : {todayLog ? 'Rempli' : 'À remplir !'}
            </p>
            {!todayLog && (
              <p className="text-sm text-gray-600 mt-1">N&apos;oublie pas de remplir ton log</p>
            )}
          </div>
          <Link href="/pipeline/log">
            <Button variant={todayLog ? 'secondary' : 'primary'}>
              {todayLog ? 'Modifier' : 'Remplir mon log'}
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Conversations" value={stats.conversations} subtitle="cette semaine" />
        <KpiCard title="Liens envoyés" value={stats.links} subtitle="cette semaine" />
        <KpiCard title="Closes" value={stats.closes} subtitle="cette semaine" />
      </div>
    </div>
  )
}

async function ManagerHome({ role, weekStart, weekEnd, today }: { role: Role; weekStart: string; weekEnd: string; today: string }) {
  const supabase = createClient()

  // Pipeline
  const { data: logs } = await supabase
    .from('setter_logs')
    .select('closes, links_sent')
    .gte('date', weekStart)
    .lte('date', weekEnd)

  const weekLogs = logs || []
  const totalCloses = weekLogs.reduce((s, l) => s + l.closes, 0)

  // Revenue (admin seulement)
  let caWeek = 0
  if (role === 'admin') {
    const { data: revenues } = await supabase
      .from('revenue_entries')
      .select('amount')
      .gte('date', weekStart)
      .lte('date', weekEnd)

    caWeek = (revenues || []).reduce((s, r) => s + Number(r.amount), 0)
  }

  // Contenu
  const { data: posts } = await supabase
    .from('content_posts')
    .select('followers_gained')
    .eq('status', 'publie')
    .gte('scheduled_at', weekStart)
    .lte('scheduled_at', weekEnd)

  const weekPosts = posts || []
  const followersGained = weekPosts.reduce((s, p) => s + p.followers_gained, 0)

  // Setter log du jour
  const { data: todayLogs } = await supabase
    .from('setter_logs')
    .select('id')
    .eq('date', today)

  const setterLoggedToday = (todayLogs || []).length > 0

  // Dernier rapport
  const { data: lastReport } = await supabase
    .from('weekly_reports')
    .select('week_start, total_closes, close_rate, ca_total')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {!setterLoggedToday && (
          <Badge className="bg-red-100 text-red-700 text-sm px-3 py-1">
            Setter n&apos;a pas rempli son log
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Closes semaine" value={totalCloses} />
        {role === 'admin' && (
          <KpiCard title="CA semaine" value={`${caWeek.toLocaleString('fr-FR')}€`} />
        )}
        <KpiCard title="Posts publiés" value={weekPosts.length} />
        <KpiCard title="Abonnés gagnés" value={followersGained} />
      </div>

      {lastReport && (
        <Card>
          <p className="text-sm font-medium text-gray-500 mb-2">Dernier rapport hebdo</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Semaine du {format(new Date(lastReport.week_start), 'dd MMMM yyyy', { locale: fr })}</p>
            <p>Closes : {lastReport.total_closes} — Taux de close : {lastReport.close_rate}%</p>
            {role === 'admin' && <p>CA : {Number(lastReport.ca_total).toLocaleString('fr-FR')}€</p>}
          </div>
        </Card>
      )}
    </div>
  )
}
