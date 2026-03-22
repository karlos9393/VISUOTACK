'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import type { IGMedia, IGMediaInsights } from '@/lib/services/instagram'

function formatType(type: string) {
  switch (type) {
    case 'REEL': return { label: 'Reel', className: 'bg-purple-100 text-purple-700' }
    case 'CAROUSEL_ALBUM': return { label: 'Carrousel', className: 'bg-blue-100 text-blue-700' }
    case 'VIDEO': return { label: 'Vidéo', className: 'bg-red-100 text-red-700' }
    default: return { label: 'Image', className: 'bg-gray-100 text-gray-700' }
  }
}

export function IgPostRow({ post }: { post: IGMedia }) {
  const [insights, setInsights] = useState<IGMediaInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const typeBadge = formatType(post.media_type)

  useEffect(() => {
    if (loaded) return
    setLoading(true)
    fetch(`/api/instagram/media/${post.id}/insights?media_type=${post.media_type}`)
      .then(r => r.json())
      .then(data => {
        setInsights(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false))
  }, [post.id, post.media_type, loaded])

  const caption = post.caption
    ? post.caption.length > 60 ? post.caption.slice(0, 60) + '...' : post.caption
    : '-'

  const date = new Date(post.timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  })

  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="py-3 pr-3">
        {(post.thumbnail_url || post.media_url) ? (
          <img
            src={post.thumbnail_url || post.media_url}
            alt=""
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-gray-200" />
        )}
      </td>
      <td className="py-3 pr-4 text-gray-900 font-medium max-w-[200px] truncate">{caption}</td>
      <td className="py-3 px-2 text-gray-500 text-xs">{date}</td>
      <td className="py-3 px-2"><Badge className={typeBadge.className}>{typeBadge.label}</Badge></td>
      <td className="py-3 px-2 text-right">{post.like_count?.toLocaleString('fr-FR') ?? '-'}</td>
      <td className="py-3 px-2 text-right">{post.comments_count?.toLocaleString('fr-FR') ?? '-'}</td>
      <td className="py-3 px-2 text-right">
        {loading ? (
          <span className="inline-block w-12 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          insights?.reach?.toLocaleString('fr-FR') ?? '-'
        )}
      </td>
      <td className="py-3 px-2 text-right">
        {loading ? (
          <span className="inline-block w-12 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          insights?.impressions?.toLocaleString('fr-FR') ?? '-'
        )}
      </td>
      <td className="py-3 px-2 text-right">
        {loading ? (
          <span className="inline-block w-12 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          insights?.saved?.toLocaleString('fr-FR') ?? '-'
        )}
      </td>
      <td className="py-3 pl-2">
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Voir
        </a>
      </td>
    </tr>
  )
}
