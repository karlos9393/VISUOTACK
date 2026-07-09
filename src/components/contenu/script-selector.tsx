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

const SNIPPET_CONTEXT = 8 // mots de contexte de chaque côté
const FALLBACK_WORDS = 20 // aperçu quand le match est dans le titre uniquement

interface IndexedScript {
  item: ScriptCatalogItem
  titleN: string
  bodyN: string
  words: string[]
  wordsN: string[]
}

interface Snippet {
  text: string
  prefix: boolean
  suffix: boolean
}

interface Scored {
  item: ScriptCatalogItem
  score: number
  snippet: Snippet | null
}

// --- Scoring de pertinence ---
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
  if (contentTokens.length > 0) {
    score += matched * 5
    if (matched === contentTokens.length) score += 10
  }
  const phrase = queryNorm.trim()
  const exact = phrase.length > 0 && (titleN.includes(phrase) || bodyN.includes(phrase))
  if (exact) score += 15
  if (matched === 0 && !exact) return 0
  return score
}

// --- Extraction du meilleur extrait (façon Ctrl+F) ---
function buildSnippet(entry: IndexedScript, contentTokens: string[]): Snippet | null {
  const { words, wordsN } = entry
  if (words.length === 0) return null

  // Indices des mots qui matchent un token de la requête
  const matches: number[] = []
  for (let i = 0; i < wordsN.length; i++) {
    for (const t of contentTokens) {
      if (t && wordsN[i].includes(t)) { matches.push(i); break }
    }
  }

  // Aucun match dans le contenu (match était dans le titre) → aperçu du début
  if (matches.length === 0) {
    const end = Math.min(words.length, FALLBACK_WORDS)
    return { text: words.slice(0, end).join(' '), prefix: false, suffix: end < words.length }
  }

  // Meilleure grappe : fenêtre contenant le plus de matches
  const SPAN = Math.max(4, contentTokens.length + 4)
  let bestStart = matches[0]
  let bestCount = -1
  for (const m of matches) {
    let c = 0
    for (const n of matches) if (n >= m && n <= m + SPAN) c++
    if (c > bestCount) { bestCount = c; bestStart = m }
  }
  const clusterEnd = matches.filter((n) => n >= bestStart && n <= bestStart + SPAN).reduce((a, b) => Math.max(a, b), bestStart)

  const start = Math.max(0, bestStart - SNIPPET_CONTEXT)
  const end = Math.min(words.length, clusterEnd + SNIPPET_CONTEXT + 1)
  return { text: words.slice(start, end).join(' '), prefix: start > 0, suffix: end < words.length }
}

// --- Highlight accent-insensible, mot par mot ---
// Un mot est surligné si un token en est une sous-chaîne. Pour les tokens courts
// (2 car. : "au", "9h"…) on exige un mot quasi identique, pour éviter de surligner
// "au" dans "Audio". Les tokens longs (≥3) tolèrent le match partiel ("lili"→"lilia").
function wordMatches(wordNorm: string, tokens: string[]): boolean {
  for (const t of tokens) {
    if (!t) continue
    if (wordNorm.includes(t) && (t.length >= 3 || wordNorm.length <= t.length + 2)) return true
  }
  return false
}

function highlight(text: string, tokens: string[]) {
  if (tokens.length === 0 || !text) return text
  const parts = text.split(/(\s+)/) // conserve les espaces pour reconstruire
  return parts.map((part, i) => {
    if (!part || /^\s+$/.test(part)) return <span key={i}>{part}</span>
    return wordMatches(normalize(part), tokens)
      ? <mark key={i} className="bg-primary-soft text-primary rounded-sm px-0.5">{part}</mark>
      : <span key={i}>{part}</span>
  })
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

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150)
    return () => clearTimeout(t)
  }, [query])

  // Index normalisé + découpage en mots (une seule fois par catalogue)
  const index = useMemo<IndexedScript[]>(
    () =>
      (catalog || []).map((item) => {
        const words = item.contenu ? item.contenu.split(/\s+/).filter(Boolean) : []
        return {
          item,
          titleN: normalize(item.titre),
          bodyN: normalize(item.contenu),
          words,
          wordsN: words.map(normalize),
        }
      }),
    [catalog]
  )

  const queryNorm = normalize(debounced).trim()
  const allTokens = queryNorm ? queryNorm.split(/\s+/).filter(Boolean) : []
  const contentTokens = allTokens.filter((t) => !STOP_WORDS.has(t))
  const hlTokens = allTokens.filter((t) => t.length >= 2) // termes à surligner (Ctrl+F)

  const scored = useMemo<Scored[] | null>(() => {
    if (!queryNorm) return null
    return index
      .map((entry) => ({ item: entry.item, score: scoreOne(entry, queryNorm, contentTokens), entry }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => ({ item: r.item, score: r.score, snippet: buildSnippet(r.entry, contentTokens) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queryNorm])

  const groups = useMemo(() => (scored === null ? groupScripts(catalog || []) : []), [scored, catalog])

  function renderRow(item: ScriptCatalogItem, opts: { label?: boolean; snippet?: Snippet | null }) {
    const isCurrent = currentScriptId && String(item.id) === String(currentScriptId)
    return (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors border ${
          isCurrent ? 'border-primary bg-primary-soft' : 'border-transparent hover:bg-gray-50'
        }`}
      >
        <span className="block line-clamp-1 font-medium text-gray-800">{highlight(item.titre, hlTokens)}</span>
        {opts.label && <span className="block text-[11px] text-gray-400 mt-0.5">{item.semaine_label}</span>}
        {opts.snippet && (
          <span className="block text-[11px] text-gray-500 mt-1 line-clamp-2 leading-snug">
            {opts.snippet.prefix ? '… ' : ''}
            {highlight(opts.snippet.text, hlTokens)}
            {opts.snippet.suffix ? ' …' : ''}
          </span>
        )}
      </button>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Associer un script" className="max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (ex : je me lève au alentour de 9h)…"
        autoFocus
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="mt-4 max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {catalog === null ? (
          <p className="text-sm text-gray-400 text-center py-10">Chargement des scripts…</p>
        ) : scored !== null ? (
          scored.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun script ne correspond</p>
          ) : (
            <div className="space-y-1">
              <p className="px-1 pb-1 text-[11px] text-gray-400">
                {scored.length} résultat{scored.length > 1 ? 's' : ''} — triés par pertinence
              </p>
              {scored.map((r) => renderRow(r.item, { label: true, snippet: r.snippet }))}
            </div>
          )
        ) : (
          <div className="space-y-5">
            {groups.map((p) => (
              <div key={p.partie}>
                <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Partie {p.partie}</p>
                <div className="space-y-3">
                  {p.semaines.map((w) => (
                    <div key={w.semaine_label}>
                      <p className="text-[11px] font-medium text-gray-400 mb-1">{w.semaine_label}</p>
                      <div className="space-y-1">{w.items.map((s) => renderRow(s, { label: false }))}</div>
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
