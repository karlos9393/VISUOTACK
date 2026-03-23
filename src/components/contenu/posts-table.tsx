'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { IGMedia, IGMediaInsights } from '@/lib/services/instagram'

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Paris',
})

function formatType(type: string) {
  switch (type) {
    case 'REEL': return { label: 'Reel', className: 'bg-purple-100 text-purple-700' }
    case 'CAROUSEL_ALBUM': return { label: 'Carrousel', className: 'bg-teal-100 text-teal-700' }
    case 'VIDEO': return { label: 'Vidéo', className: 'bg-red-100 text-red-700' }
    default: return { label: 'Image', className: 'bg-blue-100 text-blue-700' }
  }
}

function formatDate(ts: string) {
  return dateFmt.format(new Date(ts))
}

/** Post publié il y a moins de 48h */
function isRecent(ts: string): boolean {
  return Date.now() - new Date(ts).getTime() < 48 * 60 * 60 * 1000
}

type SortKey = 'timestamp' | 'like_count' | 'comments_count' | 'saved' | 'views'

interface PostsTableProps {
  media: IGMedia[]
  bestPostId?: string
  insights: Record<string, IGMediaInsights>
}

export function PostsTable({ media, bestPostId, insights }: PostsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortAsc, setSortAsc] = useState(false)

  function getViews(post: IGMedia): number {
    const ins = insights[post.id]
    return ins?.views ?? 0
  }

  /** Affiche les vues : null → "-", >0 → nombre, 0 + <48h → badge, 0 + >48h → 0 */
  function renderViews(post: IGMedia, loaded: boolean) {
    if (!loaded) return <Skeleton />
    const ins = insights[post.id]
    // Pas d'insights (erreur API) → tiret
    if (!ins || ins.views === undefined || ins.views === null) {
      return <span className="text-gray-300">-</span>
    }
    const views = ins.views
    if (views > 0) return views.toLocaleString('fr-FR')
    // Vues = 0 : vérifier l'âge du post
    if (isRecent(post.timestamp)) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
          <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
          Stats en cours
        </span>
      )
    }
    return <span className="text-gray-500">0</span>
  }

  function isLoaded(postId: string) {
    return postId in insights
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const sorted = [...media].sort((a, b) => {
    let va: number, vb: number
    switch (sortKey) {
      case 'timestamp': va = new Date(a.timestamp).getTime(); vb = new Date(b.timestamp).getTime(); break
      case 'like_count': va = a.like_count || 0; vb = b.like_count || 0; break
      case 'comments_count': va = a.comments_count || 0; vb = b.comments_count || 0; break
      case 'saved': va = insights[a.id]?.saved || 0; vb = insights[b.id]?.saved || 0; break
      case 'views': va = getViews(a); vb = getViews(b); break
      default: va = 0; vb = 0
    }
    return sortAsc ? va - vb : vb - va
  })

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={`pb-3 px-2 font-medium cursor-pointer hover:text-gray-900 select-none ${className || ''}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            {sortAsc
              ? <path d="M6 2l4 5H2z" />
              : <path d="M6 10l4-5H2z" />
            }
          </svg>
        )}
      </span>
    </th>
  )

  const Skeleton = () => <span className="inline-block w-10 h-4 bg-gray-200 rounded animate-pulse" />

  return (
    <Card>
      <div>
        <div className="flex items-center gap-2">
          <CardTitle>Posts Instagram</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Stats lifetime par post — filtrage par date de publication</p>
      </div>

      {/* Desktop table */}
      <div className="mt-4 overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500 text-xs">
              <th className="pb-3 pr-2 font-medium w-12"></th>
              <th className="pb-3 pr-3 font-medium">Caption</th>
              <SortHeader label="Date" k="timestamp" />
              <th className="pb-3 px-2 font-medium">Format</th>
              <SortHeader label="Vues" k="views" className="text-right" />
              <SortHeader label="Likes" k="like_count" className="text-right" />
              <SortHeader label="Com." k="comments_count" className="text-right" />
              <SortHeader label="Saves" k="saved" className="text-right" />
              <th className="pb-3 pl-2 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post) => {
              const loaded = isLoaded(post.id)
              const ins = insights[post.id]
              const typeBadge = formatType(post.media_type)
              const isBest = post.id === bestPostId
              const caption = post.caption
                ? post.caption.length > 60 ? post.caption.slice(0, 60) + '...' : post.caption
                : '-'

              return (
                <tr key={post.id} className={`border-b last:border-0 hover:bg-gray-50 ${isBest ? 'bg-amber-50' : ''}`}>
                  <td className="py-2 pr-2">
                    {(post.thumbnail_url || post.media_url) ? (
                      <img src={post.thumbnail_url || post.media_url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200" />
                    )}
                  </td>
                  <td className="py-2 pr-3 text-gray-900 font-medium max-w-[180px] truncate">{caption}</td>
                  <td className="py-2 px-2 text-gray-500 text-xs whitespace-nowrap">{formatDate(post.timestamp)}</td>
                  <td className="py-2 px-2"><Badge className={typeBadge.className}>{typeBadge.label}</Badge></td>
                  <td className="py-2 px-2 text-right tabular-nums">{renderViews(post, loaded)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{(post.like_count || 0).toLocaleString('fr-FR')}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{(post.comments_count || 0).toLocaleString('fr-FR')}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{loaded ? (ins?.saved ? ins.saved.toLocaleString('fr-FR') : <span className="text-gray-300">-</span>) : <Skeleton />}</td>
                  <td className="py-2 pl-2">
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" title="Voir sur Instagram">
                      <svg className="w-4 h-4 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                </tr>
              )
            })}
            {media.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-gray-400">Aucun post sur cette période</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {sorted.map((post) => {
          const loaded = isLoaded(post.id)
          const ins = insights[post.id]
          const typeBadge = formatType(post.media_type)
          const isBest = post.id === bestPostId

          const caption = post.caption
            ? post.caption.length > 80 ? post.caption.slice(0, 80) + '...' : post.caption
            : '-'

          return (
            <div key={post.id} className={`border rounded-lg p-3 ${isBest ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
              <div className="flex gap-3">
                {(post.thumbnail_url || post.media_url) ? (
                  <img src={post.thumbnail_url || post.media_url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-200 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{caption}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(post.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                <div>
                  <p className="font-semibold text-gray-900">{loaded ? (getViews(post) > 0 ? getViews(post).toLocaleString('fr-FR') : '-') : '...'}</p>
                  <p className="text-gray-400">Vues</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{(post.like_count || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-gray-400">Likes</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{(post.comments_count || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-gray-400">Com.</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{loaded ? (ins?.saved ? ins.saved.toLocaleString('fr-FR') : '-') : '...'}</p>
                  <p className="text-gray-400">Saves</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
