import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMediaList, getMediaInsights, type IGMedia } from '@/lib/services/instagram'
import { statutOf } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const INSIGHTS_CONCURRENCY = 6

interface LinkRow { media_id: string; script_id: string | null; script_override: string | null; note_manuelle?: string | null }
interface ScriptRow {
  id: string | number
  titre: string | null
  partie: string | null
  semaine: string | null
  contenu: string | null
  source: string | null
}
interface CacheRow {
  post_id: string
  plays: number | null
  impressions: number | null
  saved: number | null
  reach: number | null
  fetched_at: string
}
interface Insight { views: number; saved: number; reach: number }

/** Échappement CSV RFC 4180 : guillemets doublés, cellule quotée si , " ou saut de ligne. */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function formatLabel(t: string): string {
  if (t === 'CAROUSEL_ALBUM') return 'CAROUSEL'
  if (t === 'REEL') return 'REEL'
  if (t === 'VIDEO') return 'VIDEO'
  return 'IMAGE'
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let idx = 0
  async function worker() {
    while (idx < items.length) {
      const cur = idx++
      results[cur] = await fn(items[cur])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const sort = request.nextUrl.searchParams.get('sort') === 'views' ? 'views' : 'date'
  const admin = createAdminClient()

  // Posts (pagination complète) + liaisons + catalogue + cache insights, en parallèle
  const [posts, linksRes, scriptsRes, cacheRes] = await Promise.all([
    getMediaList(),
    admin.from('post_script_links').select('*'),
    admin.from('generateur_scripts').select('id, titre, partie, semaine, contenu, source'),
    admin.from('post_insights_cache').select('post_id, plays, impressions, saved, reach, fetched_at'),
  ])

  const linkByMedia = new Map<string, LinkRow>(
    ((linksRes.data as LinkRow[] | null) || []).map((l) => [String(l.media_id), l])
  )
  const scriptById = new Map<string, ScriptRow>(
    ((scriptsRes.data as ScriptRow[] | null) || []).map((s) => [String(s.id), s])
  )
  const cacheByPost = new Map<string, CacheRow>(
    ((cacheRes.data as CacheRow[] | null) || []).map((c) => [String(c.post_id), c])
  )

  // Insights : cache 6h en priorité, sinon fetch live (borné) + mise en cache
  const insights = await mapPool<IGMedia, Insight>(posts, INSIGHTS_CONCURRENCY, async (post) => {
    const cached = cacheByPost.get(post.id)
    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
      const views = cached.plays && cached.plays > 0 ? cached.plays : (cached.impressions || 0)
      return { views, saved: cached.saved || 0, reach: cached.reach || 0 }
    }
    const ins = await getMediaInsights(post.id, post.media_type)
    const hasData = ins.plays !== undefined || ins.impressions !== undefined || ins.saved !== undefined
    if (hasData) {
      try {
        await admin.from('post_insights_cache').upsert(
          {
            post_id: post.id,
            media_type: post.media_type,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            saved: ins.saved || 0,
            video_views: ins.video_views || 0,
            plays: ins.plays || 0,
            shares: ins.shares || 0,
            follows: ins.follows || 0,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'post_id' }
        )
      } catch {
        // best effort
      }
    }
    return { views: ins.views || 0, saved: ins.saved || 0, reach: ins.reach || 0 }
  })

  const rows = posts.map((post, i) => ({ post, ins: insights[i] }))
  rows.sort((a, b) =>
    sort === 'views'
      ? b.ins.views - a.ins.views
      : new Date(b.post.timestamp).getTime() - new Date(a.post.timestamp).getTime()
  )

  const header = [
    'date_publication', 'permalink', 'format', 'caption', 'vues', 'likes', 'commentaires',
    'saves', 'reach', 'taux_engagement', 'statut', 'note_manuelle', 'script_associe',
    'script_titre', 'script_partie', 'script_semaine', 'script_source',
  ]

  const lines = [header.join(',')]
  for (const { post, ins } of rows) {
    const link = linkByMedia.get(post.id)
    const script = link?.script_id ? scriptById.get(String(link.script_id)) : null
    const scriptText = link ? (link.script_override != null ? link.script_override : (script?.contenu ?? '')) : ''
    const likes = post.like_count || 0
    const comments = post.comments_count || 0
    const saves = ins.saved || 0
    const views = ins.views || 0
    const eng = views > 0 ? (((likes + comments + saves) / views) * 100).toFixed(1) : ''

    lines.push([
      csvCell(post.timestamp ? post.timestamp.split('T')[0] : ''),
      csvCell(post.permalink || ''),
      csvCell(formatLabel(post.media_type)),
      csvCell(post.caption || ''),
      csvCell(views),
      csvCell(likes),
      csvCell(comments),
      csvCell(saves),
      csvCell(ins.reach || 0),
      csvCell(eng),
      csvCell(statutOf(link)),
      csvCell(link?.note_manuelle ?? ''),
      csvCell(scriptText),
      csvCell(script?.titre ?? ''),
      csvCell(script?.partie ?? ''),
      csvCell(script?.semaine ?? ''),
      csvCell(script?.source ?? ''),
    ].join(','))
  }

  // BOM UTF-8 (accents corrects dans Excel/Sheets) + CRLF
  const csv = '﻿' + lines.join('\r\n')
  const filename = `generateur_export_${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
