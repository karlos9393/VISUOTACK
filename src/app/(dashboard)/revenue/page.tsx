import { createClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { KpiCard } from '@/components/ui/kpi-card'
import { RevenueForm } from '@/components/revenue/revenue-form'
import { RevenueHistory } from '@/components/revenue/revenue-history'
import { RevenueChart } from '@/components/revenue/revenue-chart'
import { WeeklyReportPreview } from '@/components/revenue/weekly-report-preview'

export default async function RevenuePage() {
  const supabase = createClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Revenue semaine
  const { data: weekEntries } = await supabase
    .from('revenue_entries')
    .select('*')
    .gte('date', format(weekStart, 'yyyy-MM-dd'))
    .lte('date', format(weekEnd, 'yyyy-MM-dd'))

  const weekData = weekEntries || []
  const caWeek = weekData.reduce((s, e) => s + Number(e.amount), 0)

  // Revenue mois
  const { data: monthEntries } = await supabase
    .from('revenue_entries')
    .select('*')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  const monthData = monthEntries || []
  const caMonth = monthData.reduce((s, e) => s + Number(e.amount), 0)

  // Revenue total
  const { data: allEntries } = await supabase
    .from('revenue_entries')
    .select('amount, offer')

  const allData = allEntries || []
  const caTotal = allData.reduce((s, e) => s + Number(e.amount), 0)
  const closes = allData.length

  // Répartition par offre
  const byOffer = {
    formation: allData.filter((e) => e.offer === 'formation').reduce((s, e) => s + Number(e.amount), 0),
    accompagnement: allData.filter((e) => e.offer === 'accompagnement').reduce((s, e) => s + Number(e.amount), 0),
    dfy: allData.filter((e) => e.offer === 'dfy').reduce((s, e) => s + Number(e.amount), 0),
  }

  // 10 dernières entrées
  const { data: recentEntries } = await supabase
    .from('revenue_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Dernier rapport hebdo
  const { data: lastReport } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="CA semaine" value={`${caWeek.toLocaleString('fr-FR')}€`} />
        <KpiCard title="CA mois" value={`${caMonth.toLocaleString('fr-FR')}€`} />
        <KpiCard title="CA total" value={`${caTotal.toLocaleString('fr-FR')}€`} />
        <KpiCard title="Nombre de closes" value={closes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueForm />
        <RevenueChart byOffer={byOffer} />
      </div>

      <RevenueHistory entries={recentEntries || []} />

      {lastReport && <WeeklyReportPreview report={lastReport} />}
    </div>
  )
}
