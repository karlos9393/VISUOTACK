import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Role } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as Role

  // Admin et manager → redirect vers pipeline
  if (role === 'admin' || role === 'manager') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile.full_name || 'Admin'}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/pipeline">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <p className="text-lg font-semibold text-gray-900">Pipeline</p>
              <p className="text-sm text-gray-500 mt-1">Funnel setter et sessions</p>
            </Card>
          </Link>
          <Link href="/contenu/calendrier">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <p className="text-lg font-semibold text-gray-900">Contenu</p>
              <p className="text-sm text-gray-500 mt-1">Calendrier et performance</p>
            </Card>
          </Link>
          {role === 'admin' && (
            <Link href="/revenue">
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <p className="text-lg font-semibold text-gray-900">Revenue</p>
                <p className="text-sm text-gray-500 mt-1">CA et ventes</p>
              </Card>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Setter
  const today = new Date().toISOString().split('T')[0]
  const { data: todayLog } = await supabase
    .from('setter_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Bonne journée, {profile.full_name || 'Setter'}
      </h1>

      <Link href="/pipeline/log">
        <Button size="lg" className="text-base px-8 py-4">
          Remplir ma session du jour
        </Button>
      </Link>

      <p className={`text-sm font-medium ${todayLog ? 'text-green-600' : 'text-red-600'}`}>
        Session du jour : {todayLog ? 'Remplie' : 'À remplir'}
      </p>
    </div>
  )
}
