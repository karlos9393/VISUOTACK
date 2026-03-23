import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://graph.facebook.com/v22.0'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const token = process.env.META_INSTAGRAM_ACCESS_TOKEN
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID

  if (!token || !accountId) {
    return NextResponse.json({
      error: 'Variables manquantes',
      hasToken: !!token,
      hasAccountId: !!accountId,
    })
  }

  const results: Record<string, unknown> = {}

  // 1) Récupérer un post récent
  try {
    const mediaRes = await fetch(
      `${BASE_URL}/${accountId}/media?fields=id,media_type,timestamp,caption&limit=3&access_token=${token}`,
      { cache: 'no-store' }
    )
    results.mediaListStatus = mediaRes.status
    const mediaData = await mediaRes.json()
    results.mediaList = mediaData

    if (mediaData.data?.[0]) {
      const post = mediaData.data[0]
      const postId = post.id
      const mediaType = post.media_type

      results.testPost = { id: postId, media_type: mediaType, caption: (post.caption || '').slice(0, 50) }

      // 2) Tester avec les nouvelles métriques v22.0+
      const metricsVideo = 'ig_reels_video_view_total_count,saved,likes,comments,shares,reach'
      const metricsImage = 'impressions,saved,likes,comments,shares,reach'
      const metrics = (mediaType === 'VIDEO' || mediaType === 'REEL') ? metricsVideo : metricsImage

      const urlNew = `${BASE_URL}/${postId}/insights?metric=${metrics}&access_token=${token}`
      const res1 = await fetch(urlNew, { cache: 'no-store' })
      const body1 = await res1.json()
      results.newMetrics = { status: res1.status, body: body1 }

      // 3) Tester juste ig_reels_video_view_total_count seul
      const minMetric = (mediaType === 'VIDEO' || mediaType === 'REEL') ? 'ig_reels_video_view_total_count' : 'impressions'
      const urlMin = `${BASE_URL}/${postId}/insights?metric=${minMetric}&access_token=${token}`
      const res2 = await fetch(urlMin, { cache: 'no-store' })
      const body2 = await res2.json()
      results.minimalMetric = { metric: minMetric, status: res2.status, body: body2 }
    }
  } catch (e) {
    results.error = String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
