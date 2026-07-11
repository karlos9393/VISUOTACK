'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { PostMedia } from './post-media'
import { ScriptPanel } from './script-panel'
import { ExportMenu } from './export-menu'
import {
  getScriptsCatalog,
  saveLeads,
  type ScriptCatalogItem,
  type PostScriptLink,
} from '@/lib/actions/generateur'
import { statutOf, type ScriptStatut } from '@/lib/types'
import type { IGMedia, IGMediaInsights } from '@/lib/services/instagram'

const FILTERS: { key: ScriptStatut | 'all'; label: string }[] = [
  { key: 'a_associer', label: 'À faire' },
  { key: 'associe', label: 'Associés' },
  { key: 'script_non_trouve', label: 'Script pas trouvé' },
  { key: 'all', label: 'Tout' },
]

const STATUT_BADGE: Record<ScriptStatut, { cls: string; label: string }> = {
  associe: { cls: 'bg-green-100 text-green-700', label: '✓ script' },
  script_non_trouve: { cls: 'bg-orange-100 text-orange-700', label: '🚫 pas trouvé' },
  a_associer: { cls: 'bg-gray-100 text-gray-400', label: 'à associer' },
}

function formatType(type: string) {
  switch (type) {
    case 'REEL': return { label: 'Reel', className: 'bg-purple-100 text-purple-700' }
    case 'VIDEO': return { label: 'Vidéo', className: 'bg-red-100 text-red-700' }
    case 'CAROUSEL_ALBUM': return { label: 'Carrousel', className: 'bg-blue-100 text-blue-700' }
    default: return { label: 'Image', className: 'bg-gray-100 text-gray-700' }
  }
}

function fr(n?: number): string {
  return typeof n === 'number' ? n.toLocaleString('fr-FR') : '-'
}

// Temps de visionnage moyen (ms → secondes lisibles). Meta renvoie des ms.
function formatWatch(ms?: number): string {
  if (!ms || ms <= 0) return '-'
  const s = ms / 1000
  if (s < 60) return `${s.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
  const min = Math.floor(s / 60)
  const rest = Math.round(s % 60)
  return `${min} min ${String(rest).padStart(2, '0')}`
}

interface GenerateurDashboardProps {
  initialMedia: IGMedia[]
  tokenExpired: boolean
  initialLinks: PostScriptLink[]
  initialNotes: Record<string, string>
  initialLeads: Record<string, number>
}

export function GenerateurDashboard({ initialMedia, tokenExpired, initialLinks, initialNotes, initialLeads }: GenerateurDashboardProps) {
  // Liens post <-> script (indexés par media_id)
  const [links, setLinks] = useState<Record<string, PostScriptLink>>(() =>
    Object.fromEntries(initialLinks.map((l) => [l.media_id, l]))
  )

  // Notes manuelles (indexées par media_id) — stockées à part (app_config)
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes)

  // Leads/DM manuels (indexés par media_id) — stockés à part (app_config)
  const [leads, setLeads] = useState<Record<string, number>>(initialLeads)

  // Filtre actif — "À faire" par défaut (on ne voit que le travail restant)
  const [filter, setFilter] = useState<ScriptStatut | 'all'>('a_associer')

  // Sélection par défaut : premier post "à faire"
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const firstTodo = initialMedia.find((m) => statutOf(links[m.id]) === 'a_associer')
    return (firstTodo ?? initialMedia[0])?.id ?? null
  })
  const selectedPost = initialMedia.find((m) => m.id === selectedId) ?? null

  const counts = useMemo(() => {
    const c: Record<ScriptStatut, number> = { a_associer: 0, associe: 0, script_non_trouve: 0 }
    for (const m of initialMedia) c[statutOf(links[m.id])]++
    return c
  }, [initialMedia, links])

  const filteredMedia = useMemo(
    () => (filter === 'all' ? initialMedia : initialMedia.filter((m) => statutOf(links[m.id]) === filter)),
    [initialMedia, links, filter]
  )

  // Catalogue des 184 scripts (chargé une fois côté client)
  const [catalog, setCatalog] = useState<ScriptCatalogItem[] | null>(null)
  useEffect(() => {
    let cancelled = false
    getScriptsCatalog()
      .then((c) => {
        if (!cancelled) setCatalog(c)
      })
      .catch(() => {
        if (!cancelled) setCatalog([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleLinked(mediaId: string, scriptId: string) {
    setLinks((prev) => ({
      ...prev,
      [mediaId]: { ...prev[mediaId], media_id: mediaId, script_id: scriptId, script_override: null },
    }))
  }
  function handleUnlinked(mediaId: string) {
    setLinks((prev) => {
      const next = { ...prev }
      delete next[mediaId]
      return next
    })
  }
  function handleMarkNotFound(mediaId: string) {
    setLinks((prev) => ({
      ...prev,
      [mediaId]: { ...prev[mediaId], media_id: mediaId, script_id: null, script_override: null },
    }))
  }
  function handleOverrideSaved(mediaId: string, text: string) {
    setLinks((prev) => {
      const existing = prev[mediaId]
      if (!existing) return prev
      return { ...prev, [mediaId]: { ...existing, script_override: text } }
    })
  }
  function handleNoteSaved(mediaId: string, text: string) {
    setNotes((prev) => ({ ...prev, [mediaId]: text }))
  }
  function handleLeadsSaved(mediaId: string, count: number) {
    setLeads((prev) => ({ ...prev, [mediaId]: count }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le Générateur</h1>
          <p className="text-xs text-gray-400 mt-1">
            Sélectionne un post pour écrire et sauvegarder son script.
          </p>
        </div>
        <ExportMenu />
      </div>

      {tokenExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-800">
            Aucun média Instagram récupéré (token expiré/invalide ?). Vérifie la connexion Meta dans /admin.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        {/* COLONNE GAUCHE — Contenu */}
        <div className="rounded-xl border border-gray-200 bg-white flex flex-col min-h-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const n = f.key === 'all' ? initialMedia.length : counts[f.key]
                const active = filter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label} ({n})
                  </button>
                )
              })}
            </div>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
            {filteredMedia.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                selected={post.id === selectedId}
                statut={statutOf(links[post.id])}
                onSelect={() => setSelectedId(post.id)}
              />
            ))}
            {filteredMedia.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-10">
                {initialMedia.length === 0 ? 'Aucun post à afficher' : 'Rien dans cette catégorie'}
              </p>
            )}
          </div>
        </div>

        {/* COLONNE DROITE — Détail du post sélectionné */}
        <div className="space-y-4">
          {selectedPost ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Détail du post</h2>
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Voir sur Instagram →
                  </a>
                </div>
                <div className="flex justify-center">
                  <PostMedia
                    key={selectedPost.id}
                    postId={selectedPost.id}
                    permalink={selectedPost.permalink}
                    thumbnailUrl={selectedPost.thumbnail_url || selectedPost.media_url}
                  />
                </div>
                <DetailMetrics post={selectedPost} />
                <CaptionBlock key={selectedPost.id} caption={selectedPost.caption} />
                <LeadsInput
                  key={selectedPost.id}
                  mediaId={selectedPost.id}
                  value={leads[selectedPost.id] ?? 0}
                  onSaved={handleLeadsSaved}
                />
              </div>

              <ScriptPanel
                post={selectedPost}
                link={links[selectedPost.id]}
                note={notes[selectedPost.id] ?? ''}
                catalog={catalog}
                onLinked={handleLinked}
                onUnlinked={handleUnlinked}
                onMarkNotFound={handleMarkNotFound}
                onOverrideSaved={handleOverrideSaved}
                onNoteSaved={handleNoteSaved}
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-400">
              Sélectionne un post à gauche
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  selected,
  statut,
  onSelect,
}: {
  post: IGMedia
  selected: boolean
  statut: ScriptStatut
  onSelect: () => void
}) {
  const typeBadge = formatType(post.media_type)
  const statutBadge = STATUT_BADGE[statut]
  const thumb = post.thumbnail_url || post.media_url
  const caption = post.caption
    ? post.caption.length > 70 ? post.caption.slice(0, 70) + '…' : post.caption
    : '—'
  const date = new Date(post.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex gap-3 rounded-lg p-2 border transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
          : 'border-transparent hover:bg-gray-50'
      }`}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-md bg-gray-200 flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
          <span className="text-xs text-gray-400">{date}</span>
          <span
            className={`ml-auto inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statutBadge.cls}`}
          >
            {statutBadge.label}
          </span>
        </div>
        <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{caption}</p>
        <div className="flex gap-3 mt-1 text-[11px] text-gray-500">
          <span>♥ {fr(post.like_count)}</span>
          <span>💬 {fr(post.comments_count)}</span>
        </div>
      </div>
    </button>
  )
}

function DetailMetrics({ post }: { post: IGMedia }) {
  const [insights, setInsights] = useState<IGMediaInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setInsights(null)
    fetch(`/api/instagram/media/${post.id}/insights?media_type=${post.media_type}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setInsights(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [post.id, post.media_type])

  const items: { label: string; value?: number; display?: string }[] = [
    { label: 'Vues', value: insights?.views },
    { label: 'Reach', value: insights?.reach },
    { label: 'Likes', value: post.like_count },
    { label: 'Commentaires', value: post.comments_count },
    { label: 'Saves', value: insights?.saved },
    { label: 'Partages', value: insights?.shares },
    { label: '⏱ Visionnage moy.', display: formatWatch(insights?.avg_watch_time) },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div key={it.label} className="text-center rounded-lg bg-gray-50 py-2 px-1">
          <p className="text-sm font-bold text-gray-900 tabular-nums">
            {loading && it.value == null && it.display == null ? (
              <span className="inline-block w-8 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              it.display ?? fr(it.value)
            )}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{it.label}</p>
        </div>
      ))}
    </div>
  )
}

// Description Instagram (caption) récupérée via l'API — lecture seule, repliable.
function CaptionBlock({ caption }: { caption?: string }) {
  const [expanded, setExpanded] = useState(false)
  const text = caption?.trim()
  if (!text) return null
  const long = text.length > 220

  return (
    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
        Description Instagram
      </p>
      <p className={`text-xs text-gray-700 whitespace-pre-wrap leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
        {text}
      </p>
      {long && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Réduire' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}

// Leads / DM générés par le reel — saisie manuelle, autosave debouncé (app_config).
function LeadsInput({
  mediaId,
  value,
  onSaved,
}: {
  mediaId: string
  value: number
  onSaved: (mediaId: string, count: number) => void
}) {
  const [raw, setRaw] = useState(value ? String(value) : '')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const skip = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    clearTimeout(timer.current)
    const n = Number.parseInt(raw, 10)
    const count = Number.isFinite(n) && n > 0 ? n : 0
    setState('saving')
    timer.current = setTimeout(async () => {
      const result = await saveLeads(mediaId, count)
      if (result.error) {
        setState('error')
      } else {
        setState('saved')
        onSaved(mediaId, count)
      }
    }, 700)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={`leads-${mediaId}`} className="block text-xs font-medium text-gray-700">
          🎯 Leads / DM générés
        </label>
        <p className="text-[10px] text-gray-400">Saisie manuelle (ManyChat, appels…)</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {state === 'saving' && <span className="text-[11px] text-gray-400">…</span>}
        {state === 'saved' && <span className="text-[11px] text-green-600">✓</span>}
        {state === 'error' && <span className="text-[11px] text-red-600">échec</span>}
        <input
          id={`leads-${mediaId}`}
          type="number"
          min={0}
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0"
          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}
