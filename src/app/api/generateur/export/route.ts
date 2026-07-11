import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMediaList, getMediaInsights, type IGMedia } from '@/lib/services/instagram'
import { statutOf } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const INSIGHTS_CONCURRENCY = 6

interface LinkRow { media_id: string; script_id: string | null; script_override: string | null }
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
  shares: number | null
  avg_watch_time: number | null
  fetched_at: string
}
interface Insight {
  views: number
  saved: number
  reach: number
  shares: number
  avg_watch_time: number
}

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

  // Posts (pagination complète) + liaisons + catalogue + cache insights + notes, en parallèle
  const [posts, linksRes, scriptsRes, cacheRes, notesRes, leadsRes] = await Promise.all([
    getMediaList(),
    admin.from('post_script_links').select('*'),
    admin.from('generateur_scripts').select('id, titre, partie, semaine, contenu, source'),
    admin
      .from('post_insights_cache')
      .select('post_id, plays, impressions, saved, reach, shares, avg_watch_time, fetched_at'),
    admin.from('app_config').select('key, value').like('key', 'note:%'),
    admin.from('app_config').select('key, value').like('key', 'leads:%'),
  ])

  const linkByMedia = new Map<string, LinkRow>(
    ((linksRes.data as LinkRow[] | null) || []).map((l) => [String(l.media_id), l])
  )
  const noteByMedia = new Map<string, string>(
    ((notesRes.data as { key: string; value: string }[] | null) || []).map((n) => [n.key.slice(5), n.value ?? ''])
  )
  const leadsByMedia = new Map<string, string>(
    ((leadsRes.data as { key: string; value: string }[] | null) || []).map((n) => [n.key.slice(6), n.value ?? ''])
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
      return {
        views,
        saved: cached.saved || 0,
        reach: cached.reach || 0,
        shares: cached.shares || 0,
        avg_watch_time: cached.avg_watch_time || 0,
      }
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
            avg_watch_time: ins.avg_watch_time || 0,
            total_watch_time: ins.total_watch_time || 0,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'post_id' }
        )
      } catch {
        // best effort
      }
    }
    return {
      views: ins.views || 0,
      saved: ins.saved || 0,
      reach: ins.reach || 0,
      shares: ins.shares || 0,
      avg_watch_time: ins.avg_watch_time || 0,
    }
  })

  const rows = posts.map((post, i) => ({ post, ins: insights[i] }))
  rows.sort((a, b) =>
    sort === 'views'
      ? b.ins.views - a.ins.views
      : new Date(b.post.timestamp).getTime() - new Date(a.post.timestamp).getTime()
  )

  const header = [
    'date_publication', 'permalink', 'format', 'caption', 'vues', 'likes', 'commentaires',
    'saves', 'partages', 'reach', 'taux_engagement', 'visionnage_moyen_s', 'leads_manuel',
    'statut', 'note_manuelle', 'script_associe',
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
    // Temps de visionnage moyen : ms → secondes (1 décimale) pour le tableur
    const watchS = ins.avg_watch_time > 0 ? (ins.avg_watch_time / 1000).toFixed(1) : ''

    lines.push([
      csvCell(post.timestamp ? post.timestamp.split('T')[0] : ''),
      csvCell(post.permalink || ''),
      csvCell(formatLabel(post.media_type)),
      csvCell(post.caption || ''),
      csvCell(views),
      csvCell(likes),
      csvCell(comments),
      csvCell(saves),
      csvCell(ins.shares || 0),
      csvCell(ins.reach || 0),
      csvCell(eng),
      csvCell(watchS),
      csvCell(leadsByMedia.get(post.id) ?? ''),
      csvCell(statutOf(link)),
      csvCell(noteByMedia.get(post.id) ?? ''),
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
