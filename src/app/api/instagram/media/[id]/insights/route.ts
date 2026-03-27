import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMediaInsights } from '@/lib/services/instagram'
import { rateLimit } from '@/lib/rate-limit'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 heures

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!rateLimit(user.id, 60, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const mediaType = request.nextUrl.searchParams.get('media_type') || 'IMAGE'
  const postId = id

  // Vérifier le cache
  const { data: cached } = await supabase
    .from('post_insights_cache')
    .select('*')
    .eq('post_id', postId)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    const isVideo = mediaType === 'VIDEO' || mediaType === 'REEL'
    const hasEmptyPlays = isVideo && (!cached.plays || cached.plays === 0)

    // Cache valide ET pas empoisonné (vidéo avec plays=0 → re-fetch)
    if (age < CACHE_TTL_MS && !hasEmptyPlays) {
      const views = (cached.plays && cached.plays > 0)
        ? cached.plays
        : (cached.impressions || 0)
      return NextResponse.json({
        impressions: cached.impressions,
        reach: cached.reach,
        saved: cached.saved,
        video_views: cached.video_views,
        plays: cached.plays,
        shares: cached.shares,
        views,
        follows: cached.follows || 0,
        _cached: true,
      })
    }
  }

  // Appeler l'API Meta
  const insights = await getMediaInsights(postId, mediaType)

  // Ne cacher que si on a vraiment des données (éviter de cacher des résultats vides)
  const hasData = insights.plays !== undefined || insights.impressions !== undefined || insights.saved !== undefined
  if (hasData) {
    const admin = createAdminClient()
    await admin.from('post_insights_cache').upsert({
      post_id: postId,
      media_type: mediaType,
      impressions: insights.impressions || 0,
      reach: insights.reach || 0,
      saved: insights.saved || 0,
      video_views: insights.video_views || 0,
      plays: insights.plays || 0,
      shares: insights.shares || 0,
      follows: insights.follows || 0,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'post_id' })
  }

  return NextResponse.json(insights)
}
