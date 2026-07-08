'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: (el?: HTMLElement) => void } }
  }
}

const EMBED_SCRIPT_SRC = 'https://www.instagram.com/embed.js'
const EMBED_WIDTH = 325 // format "petit" demandé

/** Charge embed.js une seule fois puis résout. */
function loadEmbedScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve()
    if (window.instgrm) return resolve()

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      if (window.instgrm) resolve()
      return
    }

    const script = document.createElement('script')
    script.src = EMBED_SCRIPT_SRC
    script.async = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => resolve(), { once: true })
    document.body.appendChild(script)
  })
}

/**
 * Le blockquote est injecté via dangerouslySetInnerHTML : React traite ce sous-arbre
 * comme opaque et ne réconcilie jamais ses enfants. Instagram peut donc remplacer
 * librement le blockquote par une iframe sans provoquer d'erreur removeChild côté React.
 */
function blockquoteHtml(permalink: string): string {
  return (
    `<blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14" ` +
    `style="background:#FFF;border:0;border-radius:12px;box-shadow:none;margin:0;max-width:${EMBED_WIDTH}px;min-width:0;width:100%">` +
    `<a href="${permalink}" target="_blank" rel="noopener noreferrer">Voir ce post sur Instagram</a>` +
    `</blockquote>`
  )
}

interface InstagramEmbedProps {
  permalink: string
  thumbnailUrl?: string
  caption?: string
}

export function InstagramEmbed({ permalink, thumbnailUrl, caption }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let fallbackTimer: ReturnType<typeof setTimeout>

    setFailed(false)

    async function render() {
      await loadEmbedScript()
      if (cancelled) return

      try {
        window.instgrm?.Embeds.process(containerRef.current ?? undefined)
      } catch {
        setFailed(true)
        return
      }

      // Si au bout de 4s aucune iframe n'a remplacé le blockquote → fallback
      fallbackTimer = setTimeout(() => {
        if (cancelled) return
        const hasIframe = containerRef.current?.querySelector('iframe')
        if (!hasIframe) setFailed(true)
      }, 4000)
    }

    render()

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
    }
  }, [permalink])

  if (failed) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ width: EMBED_WIDTH }}>
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={caption || 'Aperçu du post'} className="w-full object-cover" />
        ) : (
          <div className="aspect-[9/16] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Aperçu indisponible
          </div>
        )}
        <a
          href={permalink}
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
    <div style={{ width: EMBED_WIDTH }}>
      {/* dangerouslySetInnerHTML : DOM opaque pour React → pas de crash removeChild avec Instagram */}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: blockquoteHtml(permalink) }} />
    </div>
  )
}
