'use client'

import { useEffect, useState } from 'react'

const WIDTH = 325

interface Child {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
}
interface MediaDetail {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  children?: Child[]
}

interface PostMediaProps {
  postId: string
  // Données de secours (issues du post sélectionné) le temps du fetch / si l'URL manque
  permalink: string
  thumbnailUrl?: string
}

function isVideo(t?: string): boolean {
  return t === 'VIDEO' || t === 'REEL'
}

export function PostMedia({ postId, permalink, thumbnailUrl }: PostMediaProps) {
  const [media, setMedia] = useState<MediaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [idx, setIdx] = useState(0)

  // Récupère un media_url FRAIS à chaque changement de post (jamais expiré)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setMedia(null)
    setIdx(0)
    fetch(`/api/generateur/media/${postId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch'))))
      .then((d: MediaDetail) => { if (!cancelled) setMedia(d) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [postId])

  if (loading) {
    return <div className="rounded-xl bg-gray-100 animate-pulse" style={{ width: WIDTH, aspectRatio: '9 / 16' }} />
  }

  // Média actif (gère le carrousel)
  const children = media?.children ?? []
  const isCarousel = media?.media_type === 'CAROUSEL_ALBUM' && children.length > 0
  const active = isCarousel ? children[Math.min(idx, children.length - 1)] : media
  const url = active?.media_url
  const poster = active?.thumbnail_url || media?.thumbnail_url || thumbnailUrl
  const linkHref = media?.permalink || permalink // permalink FRAIS du média sélectionné

  // Fallback : media_url réellement indisponible → miniature + lien vers CE reel
  if (failed || !url) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ width: WIDTH }}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="w-full object-cover" />
        ) : (
          <div className="aspect-[9/16] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Aperçu indisponible
          </div>
        )}
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-primary hover:text-primary-hover py-2.5 border-t border-gray-100"
        >
          Ouvrir sur Instagram →
        </a>
      </div>
    )
  }

  return (
    <div style={{ width: WIDTH }}>
      {isVideo(active?.media_type) ? (
        <video key={url} src={url} poster={poster} controls playsInline className="w-full rounded-xl bg-black block" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt={media?.caption || ''} className="w-full rounded-xl block" />
      )}

      {isCarousel && children.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="text-[11px] text-gray-400">
            {Math.min(idx, children.length - 1) + 1} / {children.length}
          </span>
          <button
            onClick={() => setIdx((i) => Math.min(children.length - 1, i + 1))}
            disabled={idx >= children.length - 1}
            className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
