'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { ScriptCatalogItem } from '@/lib/actions/generateur'

interface ScriptSelectorProps {
  open: boolean
  onClose: () => void
  catalog: ScriptCatalogItem[] | null
  currentScriptId?: string | null
  onSelect: (scriptId: string) => void
}

// --- Normalisation (minuscules + suppression des accents) ---
const DIACRITICS = /[̀-ͯ]/g
function normalize(s: string): string {
  return s.normalize('NFD').replace(DIACRITICS, '').toLowerCase()
}

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'au', 'aux', 'et', 'a', 'à',
  'avec', 'en', 'dans', 'sur', 'pour', 'par', 'ou', 'où', 'que', 'qui', 'ce', 'se',
  'sa', 'son', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'nous', 'vous', 'ils',
  'elle', 'elles', 'il', 'je', 'tu', 'on', 'ne', 'pas', 'plus', 'est',
].map(normalize))

// Index normalisé calculé une fois (titre + contenu par script)
interface IndexedScript {
  item: ScriptCatalogItem
  titleN: string
  bodyN: string
}

interface Scored {
  item: ScriptCatalogItem
  score: number
}

function scoreOne(entry: IndexedScript, queryNorm: string, contentTokens: string[]): number {
  const { titleN, bodyN } = entry
  let score = 0
  let matched = 0

  for (const tok of contentTokens) {
    let hit = false
    if (titleN.includes(tok)) { score += 10; hit = true }
    if (bodyN.includes(tok)) { score += 3; hit = true }
    if (hit) matched++
  }

  // Favoriser les scripts qui contiennent le PLUS de termes de la requête
  if (contentTokens.length > 0) {
    score += matched * 5
    if (matched === contentTokens.length) score += 10 // tous les mots présents
  }

  // Bonus phrase exacte (garde les stop words : "parc avec lilia")
  const phrase = queryNorm.trim()
  const exact = phrase.length > 0 && (titleN.includes(phrase) || bodyN.includes(phrase))
  if (exact) score += 15

  // Rien de pertinent → 0 (exclu)
  if (matched === 0 && !exact) return 0
  return score
}

// --- Highlight des termes dans le titre (accent-insensible, alignement 1:1) ---
function highlightTitle(title: string, tokens: string[]) {
  if (tokens.length === 0) return title
  const chars = Array.from(title)
  let norm = ''
  const map: number[] = [] // position dans `norm` -> index du char d'origine
  chars.forEach((ch, i) => {
    for (const c of normalize(ch)) { norm += c; map.push(i) }
  })

  const hl = new Array<boolean>(chars.length).fill(false)
  for (const tok of tokens) {
    if (!tok) continue
    let from = 0
    let pos = norm.indexOf(tok, from)
    while (pos !== -1) {
      for (let k = pos; k < pos + tok.length && k < map.length; k++) hl[map[k]] = true
      from = pos + tok.length
      pos = norm.indexOf(tok, from)
    }
  }

  const nodes: React.ReactNode[] = []
  let buf = ''
  let bufHl = hl[0] ?? false
  const flush = (key: number) => {
    if (!buf) return
    nodes.push(bufHl ? <mark key={key} className="bg-primary-soft text-primary rounded px-0.5">{buf}</mark> : <span key={key}>{buf}</span>)
    buf = ''
  }
  chars.forEach((ch, i) => {
    if (hl[i] !== bufHl) { flush(i); bufHl = hl[i] }
    buf += ch
  })
  flush(chars.length)
  return nodes
}

// --- Groupement Partie -> Semaine (recherche vide) ---
interface SemaineGroup { semaine_label: string; items: ScriptCatalogItem[] }
interface PartieGroup { partie: string; semaines: SemaineGroup[] }

function groupScripts(scripts: ScriptCatalogItem[]): PartieGroup[] {
  const parties: PartieGroup[] = []
  for (const s of scripts) {
    let p = parties.find((x) => x.partie === s.partie)
    if (!p) { p = { partie: s.partie, semaines: [] }; parties.push(p) }
    let w = p.semaines.find((x) => x.semaine_label === s.semaine_label)
    if (!w) { w = { semaine_label: s.semaine_label, items: [] }; p.semaines.push(w) }
    w.items.push(s)
  }
  return parties
}

export function ScriptSelector({ open, onClose, catalog, currentScriptId, onSelect }: ScriptSelectorProps) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce léger (~150ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150)
    return () => clearTimeout(t)
  }, [query])

  // Index normalisé (une seule fois par catalogue)
  const index = useMemo<IndexedScript[]>(
    () => (catalog || []).map((item) => ({ item, titleN: normalize(item.titre), bodyN: normalize(item.contenu) })),
    [catalog]
  )

  const queryNorm = normalize(debounced).trim()
  const allTokens = queryNorm ? queryNorm.split(/\s+/).filter(Boolean) : []
  const contentTokens = allTokens.filter((t) => !STOP_WORDS.has(t))

  // Résultats scorés (null = pas de recherche → vue groupée)
  const scored = useMemo<Scored[] | null>(() => {
    if (!queryNorm) return null
    return index
      .map((entry) => ({ item: entry.item, score: scoreOne(entry, queryNorm, contentTokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queryNorm])

  const groups = useMemo(() => (scored === null ? groupScripts(catalog || []) : []), [scored, catalog])

  // Tokens à surligner (mots de contenu ; sinon la requête entière)
  const highlightTokens = contentTokens.length > 0 ? contentTokens : (queryNorm ? [queryNorm] : [])

  function renderRow(item: ScriptCatalogItem, showLabel: boolean) {
    const isCurrent = currentScriptId && String(item.id) === String(currentScriptId)
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors border ${
          isCurrent ? 'border-primary bg-primary-soft text-primary' : 'border-transparent hover:bg-gray-50 text-gray-700'
        }`}
      >
        <span className="line-clamp-1">{highlightTitle(item.titre, highlightTokens)}</span>
        {showLabel && <span className="block text-[11px] text-gray-400 mt-0.5">{item.semaine_label}</span>}
      </button>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Associer un script" className="max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (ex : parc avec lilia)…"
        autoFocus
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="mt-4 max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {catalog === null ? (
          <p className="text-sm text-gray-400 text-center py-10">Chargement des scripts…</p>
        ) : scored !== null ? (
          // --- Mode recherche : liste triée par pertinence ---
          scored.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun script ne correspond</p>
          ) : (
            <div className="space-y-1">
              <p className="px-1 pb-1 text-[11px] text-gray-400">
                {scored.length} résultat{scored.length > 1 ? 's' : ''} — triés par pertinence
              </p>
              {scored.map((r) => renderRow(r.item, true))}
            </div>
          )
        ) : (
          // --- Recherche vide : groupé Partie -> Semaine ---
          <div className="space-y-5">
            {groups.map((p) => (
              <div key={p.partie}>
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Partie {p.partie}</p>
                <div className="space-y-3">
                  {p.semaines.map((w) => (
                    <div key={w.semaine_label}>
                      <p className="text-[11px] font-medium text-gray-400 mb-1">{w.semaine_label}</p>
                      <div className="space-y-1">{w.items.map((s) => renderRow(s, false))}</div>
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
