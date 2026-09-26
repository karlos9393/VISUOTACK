'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { ConsoleLink, ConsoleSection } from '@/lib/console/links'

interface ConsolePageProps {
  sections: ConsoleSection[]
}

// Recherche insensible à la casse et aux accents
function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function ConsolePage({ sections }: ConsolePageProps) {
  const [query, setQuery] = useState('')
  const totalLinks = sections.reduce((sum, s) => sum + s.links.length, 0)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return sections
    return sections
      .map((section) => {
        const sectionMatch = normalize(`${section.title} ${section.tags?.join(' ') ?? ''}`).includes(q)
        const links = sectionMatch
          ? section.links
          : section.links.filter((link) =>
              normalize(`${link.label} ${link.description ?? ''} ${link.url}`).includes(q)
            )
        return { ...section, links }
      })
      .filter((section) => section.links.length > 0)
  }, [sections, query])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">La console</h1>
          <p className="mt-1 text-gray-500">
            Tous tes liens au même endroit · {totalLinks} liens, {sections.length} sections
          </p>
        </div>
        <div className="relative w-full sm:w-72">
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          Aucun lien ne correspond à « {query} »
        </div>
      ) : (
        filtered.map((section) => (
          <Section
            key={section.id}
            section={section}
            allLinks={sections.find((s) => s.id === section.id)?.links ?? section.links}
          />
        ))
      )}
    </div>
  )
}

// allLinks : liens non filtrés, pour garder le numéro d'étape quand la recherche masque des étapes
function Section({ section, allLinks }: { section: ConsoleSection; allLinks: ConsoleLink[] }) {
  const isFunnel = section.layout === 'funnel'

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
        {section.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
          >
            {tag}
          </span>
        ))}
        <p className="w-full text-sm text-gray-500">{section.description}</p>
      </div>

      <ol
        className={cn(
          'grid grid-cols-1 gap-3',
          isFunnel ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {section.links.map((link, i) => {
          const step = isFunnel ? allLinks.indexOf(link) + 1 : undefined
          const showArrow = isFunnel && i < section.links.length - 1
          return (
            <li key={link.url} className="relative">
              <LinkCard link={link} step={step} />
              {showArrow && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[18px] top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 xl:flex"
                >
                  <ChevronIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function LinkCard({ link, step }: { link: ConsoleLink; step?: number }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      toast('Lien copié')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('Impossible de copier le lien', 'error')
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow">
      <div className="flex items-start gap-3">
        {step !== undefined && (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{link.label}</p>
          {link.description && <p className="mt-0.5 text-sm text-gray-500">{link.description}</p>}
        </div>
      </div>

      <p className="mt-auto truncate pt-3 font-mono text-xs text-gray-400" title={link.url}>
        {displayUrl(link.url)}
      </p>

      <div className="mt-4 flex gap-2">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Ouvrir
          <ExternalIcon className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
            copied
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
    </svg>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m9 5 7 7-7 7" />
    </svg>
  )
}
