'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

interface MobileNavProps {
  role: Role
  userName: string
}

const navigation = [
  { name: 'CRM Setting', href: '/crm-tracker/setting', roles: ['admin', 'manager', 'setter'] as Role[] },
  { name: 'KINDASAMA', href: '/crm-tracker', roles: ['admin', 'manager', 'setter'] as Role[] },
  { name: 'Calendrier', href: '/contenu/calendrier', roles: ['admin'] as Role[] },
  { name: 'Performance', href: '/contenu/performance', roles: ['admin'] as Role[] },
  { name: 'Le Générateur', href: '/contenu/generateur', roles: ['admin'] as Role[] },
  { name: 'Admin', href: '/admin', roles: ['admin'] as Role[] },
]

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const filteredNav = navigation.filter((item) => item.roles.includes(role))

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 text-gray-900 flex items-center justify-between px-4 py-3">
        <Image src="/cyga-logo.png" alt="CYGA" width={798} height={313} priority className="h-7 w-auto" />
        <button onClick={() => setOpen(!open)} className="p-1 text-gray-700" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-white border-t border-gray-100 shadow-md py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block mx-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                    isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary-soft hover:text-primary'
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
            <div className="border-t border-gray-100 px-4 py-3 mt-2">
              <p className="text-sm text-gray-500">{userName}</p>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-sm text-red-500 hover:text-red-600 mt-1">
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
