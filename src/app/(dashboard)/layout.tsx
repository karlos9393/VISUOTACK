import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { ToastProvider } from '@/components/ui/toast'
import type { Role } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect('/login')
  }

  // Utiliser le admin client pour bypasser le RLS
  const adminClient = createAdminClient()

  // Chercher le profil
  let { data: profile } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si le profil n'existe pas, le créer automatiquement comme admin
  if (!profile) {
    const { data: newProfile, error: insertError } = await adminClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.email!.split('@')[0],
        role: 'admin',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erreur création profil:', insertError)
      // Fallback: afficher quand même avec des valeurs par défaut
      return (
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de profil</h1>
              <p className="text-gray-500 mb-4">Impossible de charger ton profil. Vérifie que la table users existe dans Supabase.</p>
              <p className="text-xs text-red-500">{insertError.message}</p>
              <form action="/api/auth/signout" method="POST" className="mt-4">
                <button className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Se déconnecter</button>
              </form>
            </div>
          </div>
        </ToastProvider>
      )
    }

    profile = newProfile
  }

  if (!profile) {
    redirect('/login')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar role={profile.role as Role} userName={profile.full_name || profile.email} />
        <MobileNav role={profile.role as Role} userName={profile.full_name || profile.email} />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
