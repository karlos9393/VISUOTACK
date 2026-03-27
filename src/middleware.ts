import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Non authentifié → redirection login
    if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/403') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Authentifié sur /login → redirection selon rôle
    if (user && pathname.startsWith('/login')) {
      const role = await getUserRole(supabase, user.id)
      const url = request.nextUrl.clone()
      url.pathname = role === 'setter' ? '/crm-tracker/setting' : '/crm-tracker'
      return NextResponse.redirect(url)
    }

    // Authentifié sur / ou anciennes routes pipeline → redirection
    if (user && (pathname === '/' || pathname.startsWith('/pipeline'))) {
      const role = await getUserRole(supabase, user.id)
      const url = request.nextUrl.clone()
      url.pathname = role === 'setter' ? '/crm-tracker/setting' : '/crm-tracker'
      return NextResponse.redirect(url)
    }

    // Pages réservées à l'admin
    if (user) {
      const adminOnlyPaths = ['/contenu', '/admin']
      const isAdminOnly = adminOnlyPaths.some(p => pathname.startsWith(p))

      if (isAdminOnly) {
        const role = await getUserRole(supabase, user.id)
        if (role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/crm-tracker/setting'
          return NextResponse.redirect(url)
        }
      }
    }
  } catch (error) {
    // Si Supabase est injoignable, laisser passer sans redirection
    console.error('Middleware auth error:', error)
  }

  return supabaseResponse
}

async function getUserRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role ?? 'setter'
  } catch {
    return 'setter'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
