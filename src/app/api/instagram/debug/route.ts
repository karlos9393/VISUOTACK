import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://graph.facebook.com/v22.0'

/**
 * Masque le token dans la sortie : la réponse Meta contient l'access_token
 * dans les URLs de pagination (paging.next). On le retire avant de renvoyer.
 */
function sanitize(value: unknown, token: string): unknown {
  let str = JSON.stringify(value)
  if (token) str = str.split(token).join('REDACTED')
  str = str.replace(/access_token=[^&"\\]+/g, 'access_token=REDACTED')
  return JSON.parse(str)
}

export async function GET() {
  const supabase = await createClient()
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

      // 2) Tester avec les métriques corrigées (views au lieu de plays)
      const metricsVideo = 'views,saved,likes,comments,shares,reach'
      const metricsImage = 'impressions,saved,likes,comments,shares,reach'
      const metrics = (mediaType === 'VIDEO' || mediaType === 'REEL') ? metricsVideo : metricsImage

      const urlFull = `${BASE_URL}/${postId}/insights?metric=${metrics}&access_token=${token}`
      const res1 = await fetch(urlFull, { cache: 'no-store' })
      const body1 = await res1.json()
      results.fullMetrics = { metrics, status: res1.status, body: body1 }

      // 3) Tester juste "views" seul
      const urlViews = `${BASE_URL}/${postId}/insights?metric=views&access_token=${token}`
      const res2 = await fetch(urlViews, { cache: 'no-store' })
      const body2 = await res2.json()
      results.viewsOnly = { status: res2.status, body: body2 }
    }
  } catch (e) {
    results.error = String(e)
  }

  // Masquer tout token présent dans la réponse (URLs de pagination Meta)
  return NextResponse.json(sanitize(results, token), { status: 200 })
}
