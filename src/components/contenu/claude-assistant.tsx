'use client'

import type { IGMedia } from '@/lib/services/instagram'
import type { GenerateurScript } from '@/lib/types'

interface ClaudeAssistantProps {
  post: IGMedia
  script?: GenerateurScript | null
}

/**
 * STUB — Phase 2.
 * Ce composant recevra plus tard le post + le script + les métriques et appellera
 * une route serveur branchée sur l'API Anthropic (claude-opus-4-8) pour analyser
 * ce qui performe et proposer des variations de script.
 * Ne rien implémenter ici pour l'instant.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ClaudeAssistant({ post, script }: ClaudeAssistantProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-gray-700">Assistant IA</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
          Bientôt
        </span>
      </div>
      <p className="text-xs text-gray-500">
        L&apos;analyse et la génération de scripts par IA arriveront à l&apos;étape suivante.
      </p>
    </div>
  )
}
