'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScriptSelector } from './script-selector'
import type { IGMedia } from '@/lib/services/instagram'
import {
  linkScript,
  unlinkScript,
  markNotFound,
  saveOverride,
  saveNote,
  type ScriptCatalogItem,
  type PostScriptLink,
} from '@/lib/actions/generateur'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const AUTOSAVE_DELAY = 800

interface ScriptPanelProps {
  post: IGMedia
  link: PostScriptLink | undefined
  catalog: ScriptCatalogItem[] | null
  onLinked: (mediaId: string, scriptId: string) => void
  onUnlinked: (mediaId: string) => void
  onMarkNotFound: (mediaId: string) => void
  onOverrideSaved: (mediaId: string, text: string) => void
  onNoteSaved: (mediaId: string, text: string) => void
}

export function ScriptPanel({ post, link, catalog, onLinked, onUnlinked, onMarkNotFound, onOverrideSaved, onNoteSaved }: ScriptPanelProps) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const linked = Boolean(link?.script_id)
  const notFound = Boolean(link && !link.script_id)
  const source = useMemo(
    () => (linked && catalog ? catalog.find((s) => String(s.id) === String(link!.script_id)) : undefined),
    [linked, catalog, link]
  )

  // --- Éditeur (script_override) ---
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const linkRef = useRef<PostScriptLink | undefined>(link)
  linkRef.current = link
  const skipNextSave = useRef(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Identité de ce qu'on édite : ne réamorce QUE si le post ou le script lié change
  const identity = `${post.id}::${link?.script_id ?? ''}`

  useEffect(() => {
    if (!linked) {
      setReady(false)
      return
    }
    // override courant (lu via ref pour ne pas boucler sur la frappe), sinon contenu source
    const override = linkRef.current?.script_override
    const base = override != null ? override : source?.contenu
    if (base == null) {
      setReady(false)
      return // en attente du catalogue
    }
    skipNextSave.current = true
    setText(base)
    setReady(true)
    setSaveState('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, source?.contenu, linked])

  // Autosave debounced → script_override (jamais la source)
  useEffect(() => {
    if (!ready) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    setSaveState('saving')
    clearTimeout(debounceRef.current)
    const current = text
    debounceRef.current = setTimeout(async () => {
      const result = await saveOverride(post.id, current)
      if (result.error) {
        setSaveState('error')
      } else {
        setSaveState('saved')
        onOverrideSaved(post.id, current)
      }
    }, AUTOSAVE_DELAY)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, ready, post.id])

  async function handleSelect(scriptId: string) {
    setSelectorOpen(false)
    setBusy(true)
    const result = await linkScript(post.id, scriptId)
    setBusy(false)
    if (!result.error) onLinked(post.id, scriptId)
  }

  async function handleUnlink() {
    setBusy(true)
    const result = await unlinkScript(post.id)
    setBusy(false)
    if (!result.error) onUnlinked(post.id)
  }

  async function handleMarkNotFound() {
    setBusy(true)
    const result = await markNotFound(post.id)
    setBusy(false)
    if (!result.error) onMarkNotFound(post.id)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Script associé</h3>
        {linked && <SaveIndicator state={saveState} />}
      </div>

      {notFound ? (
        // CAS 3 — marqué "script pas trouvé"
        <div className="space-y-4">
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 mb-3">
              🚫 Script pas trouvé
            </div>
            <div>
              <Button variant="secondary" onClick={handleUnlink} disabled={busy}>
                Annuler / Rechercher à nouveau
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <ManualNote key={post.id} mediaId={post.id} note={link?.note_manuelle ?? ''} onSaved={onNoteSaved} />
          </div>
        </div>
      ) : !linked ? (
        // CAS 1 — aucun script lié → associer OU marquer pas trouvé
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-3">Aucun script associé à ce post.</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button onClick={() => setSelectorOpen(true)} disabled={busy}>
              ＋ Associer un script
            </Button>
            <Button variant="secondary" onClick={handleMarkNotFound} disabled={busy}>
              🚫 Script pas trouvé
            </Button>
          </div>
        </div>
      ) : (
        // CAS 2 — script lié
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Script lié</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {source ? source.titre : catalog ? '(script introuvable)' : 'Chargement…'}
              </p>
              {source && <p className="text-[11px] text-gray-400">{source.semaine_label}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectorOpen(true)} disabled={busy}>
                Changer
              </Button>
              <Button variant="danger" size="sm" onClick={handleUnlink} disabled={busy}>
                Dissocier
              </Button>
            </div>
          </div>

          {ready ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed resize-y focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div className="h-40 bg-gray-100 rounded animate-pulse" />
          )}
          <p className="text-[11px] text-gray-400">
            Les modifications sont propres à ce post et n&apos;altèrent pas le script d&apos;origine.
          </p>

          <div className="border-t border-gray-100 pt-4">
            <ManualNote key={post.id} mediaId={post.id} note={link?.note_manuelle ?? ''} onSaved={onNoteSaved} />
          </div>
        </div>
      )}

      <ScriptSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        catalog={catalog}
        currentScriptId={link?.script_id}
        onSelect={handleSelect}
      />
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="text-xs text-gray-400">Enregistrement…</span>
  if (state === 'saved') return <span className="text-xs text-green-600">Enregistré ✓</span>
  if (state === 'error') return <span className="text-xs text-red-600">Échec de sauvegarde</span>
  return null
}

// Note manuelle (description du reel) — autosave debouncé, flush à la sortie (pas de perte).
// Remontée par key={post.id} → réinitialise proprement à chaque changement de post.
function ManualNote({
  mediaId,
  note,
  onSaved,
}: {
  mediaId: string
  note: string
  onSaved: (mediaId: string, text: string) => void
}) {
  const [text, setText] = useState(note)
  const [state, setState] = useState<SaveState>('idle')
  const latest = useRef(note)
  const savedRef = useRef(note)
  const skip = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function flush() {
    if (latest.current === savedRef.current) return
    const cur = latest.current
    setState('saving')
    const result = await saveNote(mediaId, cur)
    if (result.error) {
      setState('error')
    } else {
      savedRef.current = cur
      setState('saved')
      onSaved(mediaId, cur)
    }
  }

  // Autosave debouncé à chaque frappe
  useEffect(() => {
    if (skip.current) { skip.current = false; return }
    latest.current = text
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 800)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  // Flush si une sauvegarde est en attente au démontage (changement de post)
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          📝 Note manuelle (description du reel)
        </label>
        <SaveIndicator state={state} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder="Décris ce que tu dis dans le reel. Si une question est posée dans la vidéo, note-la avec sa réponse. Ex : Q: Comment constituer une équipe ménage ? R: Je passe par des sous-traitants locaux…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed resize-y focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}
