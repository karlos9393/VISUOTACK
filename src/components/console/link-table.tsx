'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { ConsoleRow, ConsoleSection } from '@/lib/console/types'
import { CheckIcon, CopyIcon, ExternalIcon } from './console-icons'

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function useCopy() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast(message)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('Impossible de copier', 'error')
    }
  }

  return { copied, copy }
}

interface LinkTableProps {
  rows: ConsoleRow[]
  // Résultats de recherche : rappelle la section de chaque lien
  showSection?: boolean
}

// Tableau façon note : Étape | Page | Lien (empilé sur mobile)
export function LinkTable({ rows, showSection = false }: LinkTableProps) {
  const isFunnel = rows.some((row) => row.step !== undefined)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
        <span>{isFunnel ? 'Étape' : 'Nom'}</span>
        <span>Page</span>
        <span>Lien</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map((row) => (
          <LinkRow key={row.link.url} row={row} showSection={showSection} />
        ))}
      </ul>
    </div>
  )
}

function LinkRow({ row, showSection }: { row: ConsoleRow; showSection: boolean }) {
  const { link, step, section } = row
  const { copied, copy } = useCopy()

  return (
    <li
      className={cn(
        'grid grid-cols-1 gap-2 px-5 py-3.5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center md:gap-4',
        link.offFunnel && 'bg-gray-50/60'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {(step !== undefined || link.offFunnel) && (
          <span
            className={cn(
              'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
              step !== undefined ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
            )}
          >
            {step ?? '—'}
          </span>
        )}
        <div className="min-w-0">
          {showSection && <p className="truncate text-xs text-gray-400">{section.title}</p>}
          <p className="truncate font-medium text-gray-900">{link.label}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500">{link.description}</p>

      <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-1.5">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.url}
          className="min-w-0 flex-1 truncate font-mono text-xs text-gray-600 hover:text-primary hover:underline"
        >
          {displayUrl(link.url)}
        </a>
        <button
          type="button"
          onClick={() => copy(link.url, 'Lien copié')}
          aria-label={`Copier le lien ${link.label}`}
          className={cn(
            'inline-flex flex-shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
            copied
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
          )}
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ouvrir ${link.label}`}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Ouvrir
          <ExternalIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </li>
  )
}

// Copie tout le tunnel en texte (à coller dans une note ou un message)
export function CopyAllButton({ section, rows }: { section: ConsoleSection; rows: ConsoleRow[] }) {
  const { copied, copy } = useCopy()
  const text = [
    section.title,
    ...rows.map((row) => `${row.step !== undefined ? `${row.step}.` : '—'} ${row.link.label} : ${row.link.url}`),
  ].join('\n')

  return (
    <button
      type="button"
      onClick={() => copy(text, 'Tous les liens copiés')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
        copied
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      )}
    >
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      {section.layout === 'funnel' ? 'Copier tout le tunnel' : 'Copier tous les liens'}
    </button>
  )
}
