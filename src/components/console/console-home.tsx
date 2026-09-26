'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { sectionRows, type ConsoleSection } from '@/lib/console/types'
import { LinkTable } from './link-table'
import { ArrowRightIcon, SearchIcon, SectionIcon } from './console-icons'

// Recherche insensible à la casse et aux accents
function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function ConsoleHome({ sections }: { sections: ConsoleSection[] }) {
  const [query, setQuery] = useState('')
  const totalLinks = sections.reduce((sum, s) => sum + s.links.length, 0)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return null
    return sections.flatMap((section) =>
      sectionRows(section).filter(({ link }) =>
        normalize(`${section.title} ${section.tags?.join(' ') ?? ''} ${link.label} ${link.description ?? ''} ${link.url}`).includes(q)
      )
    )
  }, [sections, query])

  const groups = [
    { title: 'Tunnels', sections: sections.filter((s) => s.layout === 'funnel') },
    { title: 'Liens utiles', sections: sections.filter((s) => s.layout === 'grid') },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">La console</h1>
          <p className="mt-1 text-gray-500">Tous tes liens · {totalLinks} liens</p>
        </div>
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un lien…"
            aria-label="Rechercher un lien"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {results ? (
        results.length > 0 ? (
          <LinkTable rows={results} showSection />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            Aucun lien ne correspond à « {query} »
          </div>
        )
      ) : (
        groups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.sections.map((section) => (
                <SectionTile key={section.id} section={section} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function SectionTile({ section }: { section: ConsoleSection }) {
  const steps = section.links.filter((link) => !link.offFunnel)

  return (
    <Link
      href={`/console/${section.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <SectionIcon name={section.icon} className="h-11 w-11" />
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {section.links.length} {section.links.length > 1 ? 'liens' : 'lien'}
        </span>
      </div>
      <p className="mt-4 font-semibold text-gray-900">{section.title}</p>
      <p className="mt-0.5 text-sm text-gray-500">{section.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="min-w-0 truncate text-xs text-gray-400">
          {section.layout === 'funnel'
            ? steps.map((link) => link.label).join(' → ')
            : steps.map((link) => link.label).join(' · ')}
        </p>
        <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  )
}
