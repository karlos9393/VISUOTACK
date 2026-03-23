import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://graph.facebook.com/v19.0'

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

      // 2) Tester les insights AVEC period=lifetime
      const metricsVideo = 'plays,saved,comments,likes,shares,follows'
      const metricsImage = 'impressions,saved,comments,likes,shares,follows'
      const metrics = (mediaType === 'VIDEO' || mediaType === 'REEL') ? metricsVideo : metricsImage

      const urlWithPeriod = `${BASE_URL}/${postId}/insights?metric=${metrics}&period=lifetime&access_token=${token}`
      const res1 = await fetch(urlWithPeriod, { cache: 'no-store' })
      const body1 = await res1.json()
      results.withPeriodLifetime = { status: res1.status, body: body1 }

      // 3) Tester les insights SANS period
      const urlWithout = `${BASE_URL}/${postId}/insights?metric=${metrics}&access_token=${token}`
      const res2 = await fetch(urlWithout, { cache: 'no-store' })
      const body2 = await res2.json()
      results.withoutPeriod = { status: res2.status, body: body2 }

      // 4) Tester avec métriques minimales (juste plays ou impressions)
      const minMetric = (mediaType === 'VIDEO' || mediaType === 'REEL') ? 'plays' : 'impressions'
      const urlMin = `${BASE_URL}/${postId}/insights?metric=${minMetric}&access_token=${token}`
      const res3 = await fetch(urlMin, { cache: 'no-store' })
      const body3 = await res3.json()
      results.minimalMetric = { metric: minMetric, status: res3.status, body: body3 }
    }
  } catch (e) {
    results.error = String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
