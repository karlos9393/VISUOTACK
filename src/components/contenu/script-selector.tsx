'use client'

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { ScriptCatalogItem } from '@/lib/actions/generateur'

interface ScriptSelectorProps {
  open: boolean
  onClose: () => void
  catalog: ScriptCatalogItem[] | null
  currentScriptId?: string | null
  onSelect: (scriptId: string) => void
}

interface SemaineGroup {
  semaine_label: string
  items: ScriptCatalogItem[]
}
interface PartieGroup {
  partie: string
  semaines: SemaineGroup[]
}

function groupScripts(scripts: ScriptCatalogItem[]): PartieGroup[] {
  const parties: PartieGroup[] = []
  for (const s of scripts) {
    let p = parties.find((x) => x.partie === s.partie)
    if (!p) {
      p = { partie: s.partie, semaines: [] }
      parties.push(p)
    }
    let w = p.semaines.find((x) => x.semaine_label === s.semaine_label)
    if (!w) {
      w = { semaine_label: s.semaine_label, items: [] }
      p.semaines.push(w)
    }
    w.items.push(s)
  }
  return parties
}

export function ScriptSelector({ open, onClose, catalog, currentScriptId, onSelect }: ScriptSelectorProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!catalog) return []
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter(
      (s) => s.titre.toLowerCase().includes(q) || s.contenu.toLowerCase().includes(q)
    )
  }, [catalog, query])

  const groups = useMemo(() => groupScripts(filtered), [filtered])

  return (
    <Modal open={open} onClose={onClose} title="Associer un script" className="max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un script (titre ou contenu)…"
        autoFocus
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="mt-4 max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {catalog === null ? (
          <p className="text-sm text-gray-400 text-center py-10">Chargement des scripts…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Aucun script ne correspond</p>
        ) : (
          <div className="space-y-5">
            {groups.map((p) => (
              <div key={p.partie}>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">
                  Partie {p.partie}
                </p>
                <div className="space-y-3">
                  {p.semaines.map((w) => (
                    <div key={w.semaine_label}>
                      <p className="text-[11px] font-medium text-gray-400 mb-1">{w.semaine_label}</p>
                      <div className="space-y-1">
                        {w.items.map((s) => {
                          const isCurrent = currentScriptId && String(s.id) === String(currentScriptId)
                          return (
                            <button
                              key={s.id}
                              onClick={() => onSelect(s.id)}
                              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors border ${
                                isCurrent
                                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                                  : 'border-transparent hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="line-clamp-1">{s.titre}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
