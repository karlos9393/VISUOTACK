import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMediaInsights } from '@/lib/services/instagram'

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 heures

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const mediaType = request.nextUrl.searchParams.get('media_type') || 'IMAGE'
  const postId = params.id

  // Vérifier le cache
  const { data: cached } = await supabase
    .from('post_insights_cache')
    .select('*')
    .eq('post_id', postId)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({
        impressions: cached.impressions,
        reach: cached.reach,
        saved: cached.saved,
        video_views: cached.video_views,
        plays: cached.plays,
        shares: cached.shares,
        _cached: true,
      })
    }
  }

  // Appeler l'API Meta
  const insights = await getMediaInsights(postId, mediaType)

  // Sauvegarder en cache via admin client
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
    fetched_at: new Date().toISOString(),
  }, { onConflict: 'post_id' })

  return NextResponse.json(insights)
}
