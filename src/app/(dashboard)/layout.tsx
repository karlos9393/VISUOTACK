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
  const supabase = await createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Layout auth error:', e)
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  // Utiliser le admin client pour bypasser le RLS
  const adminClient = createAdminClient()
  let profile = null

  try {
    const { data } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  } catch (e) {
    console.error('Layout profile fetch error:', e)
  }

  // Si le profil n'existe pas, le créer
  if (!profile) {
    try {
      const { data: newProfile } = await adminClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.email!.split('@')[0],
          role: 'setter',
        })
        .select()
        .single()
      profile = newProfile
    } catch (e) {
      console.error('Layout profile create error:', e)
    }
  }

  // Fallback si profil toujours null — afficher une page d'erreur (PAS redirect)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration requise</h1>
          <p className="text-gray-500 mb-4">
            Le profil utilisateur n&apos;a pas pu être créé. Vérifie que les tables existent dans Supabase
            et que le schéma SQL a bien été exécuté.
          </p>
          <p className="text-xs text-gray-400 mb-6">User ID: {user.id} / Email: {user.email}</p>
          <form action="/api/auth/signout" method="POST">
            <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    )
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
