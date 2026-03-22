const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID
const BASE_URL = 'https://graph.facebook.com/v19.0'

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

// Insights d'un post (vues, reach, saves)
export async function getMediaInsights(mediaId: string, mediaType: string): Promise<IGMediaInsights> {
  const token = getToken()
  if (!token) return {}

  try {
    const metrics = mediaType === 'VIDEO' || mediaType === 'REEL'
      ? 'impressions,reach,saved,video_views,plays'
      : 'impressions,reach,saved'

    const res = await fetch(
      `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
    )
    if (!res.ok) return {}
    const data = await res.json()

    const insights: IGMediaInsights = {}
    for (const item of data.data || []) {
      const value = item.values?.[0]?.value ?? 0
      switch (item.name) {
        case 'impressions': insights.impressions = value; break
        case 'reach': insights.reach = value; break
        case 'saved': insights.saved = value; break
        case 'video_views': insights.video_views = value; break
        case 'plays': insights.plays = value; break
      }
    }
    return insights
  } catch {
    return {}
  }
}

// Insights du compte sur une période
export async function getAccountInsights(since: string, until: string) {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch(
      `${BASE_URL}/${IG_ACCOUNT_ID}/insights?metric=follower_count,impressions,reach&period=day&since=${since}&until=${until}&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
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
