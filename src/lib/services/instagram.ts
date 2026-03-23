const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID
const BASE_URL = 'https://graph.facebook.com/v22.0'

function getToken(): string {
  return process.env.META_INSTAGRAM_ACCESS_TOKEN || ''
}

export interface IGAccountStats {
  followers_count: number
  media_count: number
  name: string
  username: string
  id: string
}

export interface IGMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL'
  media_url?: string
  thumbnail_url?: string
  timestamp: string
  like_count: number
  comments_count: number
  permalink: string
}

export interface IGInsightValue {
  value: number
  end_time?: string
}

export interface IGInsight {
  name: string
  values: IGInsightValue[]
}

export interface IGMediaInsights {
  impressions?: number
  reach?: number
  saved?: number
  video_views?: number
  plays?: number
  shares?: number
  views?: number
  follows?: number
  likes?: number
  comments?: number
}

export interface IGAccountInsightsDay {
  date: string
  impressions: number
  reach: number
  follower_count: number
}

// Stats du compte (followers, nb posts)
export async function getAccountStats(): Promise<IGAccountStats | null> {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch(
      `${BASE_URL}/${IG_ACCOUNT_ID}?fields=followers_count,media_count,name,username&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Liste des 50 derniers posts avec stats de base
export async function getMediaList(): Promise<IGMedia[]> {
  const token = getToken()
  if (!token) return []

  try {
    const res = await fetch(
      `${BASE_URL}/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=50&access_token=${token}`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

// Insights d'un post (vues, saves, likes, etc.)
export async function getMediaInsights(mediaId: string, mediaType: string): Promise<IGMediaInsights> {
  const token = getToken()
  if (!token) return {}

  try {
    // Métriques selon le type de media (v22.0+)
    // plays est remplacé par ig_reels_video_view_total_count depuis v22.0
    let metrics: string
    if (mediaType === 'VIDEO' || mediaType === 'REEL') {
      metrics = 'ig_reels_video_view_total_count,saved,likes,comments,shares,reach'
    } else if (mediaType === 'CAROUSEL_ALBUM') {
      metrics = 'impressions,saved,likes,comments,shares,reach'
    } else {
      metrics = 'impressions,saved,likes,comments,shares,reach'
    }

    const url = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`[getMediaInsights] HTTP ${res.status} for ${mediaId} (${mediaType}): ${errorBody}`)
      return {}
    }

    const data = await res.json()

    // Debug: voir la structure exacte retournée par l'API Meta
    console.log(`[getMediaInsights] ${mediaId} (${mediaType}):`, JSON.stringify(data, null, 2))

    if (data.error) {
      console.error(`Insights error for ${mediaId}:`, data.error)
      return {}
    }

    // Normaliser les données retournées
    const insights: IGMediaInsights = {}
    for (const item of data.data || []) {
      const value = item.values?.[0]?.value ?? item.value ?? 0
      switch (item.name) {
        case 'impressions': insights.impressions = value; break
        case 'reach': insights.reach = value; break
        case 'saved': insights.saved = value; break
        case 'video_views': insights.video_views = value; break
        case 'plays': insights.plays = value; break
        case 'ig_reels_video_view_total_count': insights.plays = value; break
        case 'shares': insights.shares = value; break
        case 'likes': insights.likes = value; break
        case 'comments': insights.comments = value; break
      }
    }

    // Alias : vues = plays (vidéos) ou impressions (images)
    if (insights.plays !== undefined) {
      insights.views = insights.plays
    } else if (insights.impressions !== undefined) {
      insights.views = insights.impressions
    }

    return insights
  } catch {
    return {}
  }
}

// Insights du compte sur une période (données par jour)
export async function getAccountInsights(since: string, until: string): Promise<IGAccountInsightsDay[]> {
  const token = getToken()
  if (!token) return []

  try {
    const res = await fetch(
      `${BASE_URL}/${IG_ACCOUNT_ID}/insights?metric=follower_count,impressions,reach&period=day&since=${since}&until=${until}&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const json = await res.json()

    // Transformer les données brutes en jours
    const metrics: Record<string, Record<string, number>> = {}
    for (const metric of json.data || []) {
      for (const v of metric.values || []) {
        const date = v.end_time?.split('T')[0] || ''
        if (!metrics[date]) metrics[date] = {}
        metrics[date][metric.name] = v.value ?? 0
      }
    }

    return Object.entries(metrics)
      .map(([date, vals]) => ({
        date,
        impressions: vals.impressions || 0,
        reach: vals.reach || 0,
        follower_count: vals.follower_count || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

// Rafraîchir le long-lived token
export async function refreshLongLivedToken(currentToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token || null
  } catch {
    return null
  }
}
