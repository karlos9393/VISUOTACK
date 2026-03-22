'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface MobileNavProps {
  role: Role
  userName: string
}

const navigation = [
  { name: 'Accueil', href: '/', roles: ['admin', 'manager', 'setter'] as Role[] },
  { name: 'Session du jour', href: '/pipeline/log', roles: ['admin', 'manager', 'setter'] as Role[] },
  { name: 'Pipeline', href: '/pipeline', roles: ['admin', 'manager'] as Role[] },
  { name: 'Calendrier', href: '/contenu/calendrier', roles: ['admin', 'manager', 'setter'] as Role[] },
  { name: 'Performance', href: '/contenu/performance', roles: ['admin', 'manager'] as Role[] },
  { name: 'Revenue', href: '/revenue', roles: ['admin'] as Role[] },
  { name: 'Admin', href: '/admin', roles: ['admin'] as Role[] },
]

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 text-white flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold">CYGA</span>
        <button onClick={() => setOpen(!open)} className="p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-gray-900 border-t border-gray-800 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredNav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
            <div className="border-t border-gray-800 px-4 py-3 mt-2">
              <p className="text-sm text-gray-400">{userName}</p>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-red-400 hover:text-red-300 mt-1">
                  Déconnexion
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
