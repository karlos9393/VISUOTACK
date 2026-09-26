import Link from 'next/link'
import { cn } from '@/lib/utils'
import { sectionRows, type ConsoleSection } from '@/lib/console/types'
import { CopyAllButton, LinkTable } from './link-table'
import { ArrowLeftIcon, SectionIcon } from './console-icons'

interface SectionViewProps {
  section: ConsoleSection
  // Toutes les sections, pour les onglets
  sections: ConsoleSection[]
}

export function SectionView({ section, sections }: SectionViewProps) {
  const rows = sectionRows(section)

  return (
    <div className="space-y-6">
      <Link
        href="/console"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        La console
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <SectionIcon name={section.icon} className="h-12 w-12" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
            <p className="mt-0.5 text-gray-500">{section.description}</p>
          </div>
        </div>
        <CopyAllButton section={section} rows={rows} />
      </div>

      {/* Passer d'une section à l'autre sans revenir au tableau de bord */}
      <nav
        aria-label="Sections de la console"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {sections.map((s) => {
          const active = s.id === section.id
          return (
            <Link
              key={s.id}
              href={`/console/${s.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary'
              )}
            >
              {s.title}
            </Link>
          )
        })}
      </nav>

      <LinkTable rows={rows} />
    </div>
  )
}
