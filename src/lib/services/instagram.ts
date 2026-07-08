const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID
const BASE_URL = 'https://graph.facebook.com/v22.0'

// Clé app_config où vit le token (source de vérité, rotable sans redéploiement)
export const TOKEN_CONFIG_KEY = 'meta_instagram_access_token'
export const TOKEN_EXPIRY_CONFIG_KEY = 'meta_instagram_token_expires_at'

// Cache mémoire du token (par instance lambda) pour éviter un aller-retour DB à chaque appel Graph
const TOKEN_CACHE_MS = 5 * 60 * 1000
let cachedToken: { value: string; fetchedAt: number } | null = null

/**
 * Récupère le token Instagram.
 * Priorité : table app_config (rotable à chaud) → variable d'env (fallback).
 * Lecture DB via le client service_role, mise en cache 5 min.
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_CACHE_MS) {
    return cachedToken.value
  }

  let token = ''
  try {
    // Import paresseux : évite d'embarquer le client admin dans un bundle client
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data } = await admin
      .from('app_config')
      .select('value')
      .eq('key', TOKEN_CONFIG_KEY)
      .single()
    token = data?.value?.trim() || ''
  } catch {
    token = ''
  }

  // Fallback env var (compat + bootstrap initial)
  if (!token) token = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() || ''

  cachedToken = { value: token, fetchedAt: Date.now() }
  return token
}

/** Vide le cache mémoire du token (à appeler après une rotation manuelle). */
export function invalidateTokenCache(): void {
  cachedToken = null
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
  const token = await getToken()
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
  const token = await getToken()
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
  const token = await getToken()
  if (!token) return {}

  try {
    // Métriques selon le type de media (v22.0)
    let metrics: string
    if (mediaType === 'VIDEO' || mediaType === 'REEL') {
      metrics = 'views,saved,likes,comments,shares,reach'
    } else {
      metrics = 'impressions,saved,likes,comments,shares,reach'
    }

    const url = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      return {}
    }

    const data = await res.json()

    if (data.error) {
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
        case 'views': insights.views = value; break
        case 'shares': insights.shares = value; break
        case 'likes': insights.likes = value; break
        case 'comments': insights.comments = value; break
      }
    }

    // Alias : si views n'est pas déjà set, fallback sur plays puis impressions
    if (insights.views === undefined) {
      if (insights.plays !== undefined) {
        insights.views = insights.plays
      } else if (insights.impressions !== undefined) {
        insights.views = insights.impressions
      }
    }

    return insights
  } catch {
    return {}
  }
}

// Insights du compte sur une période (données par jour)
export async function getAccountInsights(since: string, until: string): Promise<IGAccountInsightsDay[]> {
  const token = await getToken()
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

// Posts d'une période (filtré par since/until en Unix timestamp)
export async function getPostsForPeriod(start: Date, end: Date): Promise<IGMedia[]> {
  const token = await getToken()
  if (!token) return []

  const since = Math.floor(start.getTime() / 1000)
  const until = Math.floor(end.getTime() / 1000)

  try {
    const allMedia: IGMedia[] = []
    let url: string | null =
      `${BASE_URL}/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&since=${since}&until=${until}&limit=50&access_token=${token}`

    while (url) {
      const res: Response = await fetch(url, { cache: 'no-store' })
      if (!res.ok) break
      const data: { data?: IGMedia[]; paging?: { next?: string } } = await res.json()
      allMedia.push(...(data.data || []))
      url = data.paging?.next || null
    }

    return allMedia
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

// ---- Surveillance de validité / expiration du token ----

export interface IGTokenStatus {
  valid: boolean
  neverExpires: boolean
  expiresAt: string | null // ISO 8601, ou null si jamais d'expiration / inconnu
  daysRemaining: number | null
  type?: string // ex. 'USER', 'PAGE', 'SYSTEM_USER'
  scopes?: string[]
  error?: string
}

/**
 * Interroge l'endpoint Meta /debug_token pour connaître la validité et la date
 * d'expiration exacte d'un token. Nécessite META_APP_ID + META_APP_SECRET.
 * expires_at === 0 côté Meta = token qui n'expire jamais (System User "Never").
 */
export async function debugToken(token: string): Promise<IGTokenStatus> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!token) {
    return { valid: false, neverExpires: false, expiresAt: null, daysRemaining: null, error: 'Aucun token configuré' }
  }
  if (!appId || !appSecret) {
    return { valid: false, neverExpires: false, expiresAt: null, daysRemaining: null, error: 'META_APP_ID / META_APP_SECRET manquants' }
  }

  try {
    const res = await fetch(
      `${BASE_URL}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    const d = json?.data

    if (!d) {
      return { valid: false, neverExpires: false, expiresAt: null, daysRemaining: null, error: json?.error?.message || 'Réponse debug_token vide' }
    }

    const expiresAtUnix: number = d.expires_at ?? 0
    const neverExpires = !expiresAtUnix // 0 (ou absent) = jamais d'expiration
    const expiresAt = neverExpires ? null : new Date(expiresAtUnix * 1000).toISOString()
    const daysRemaining = neverExpires
      ? null
      : Math.floor((expiresAtUnix * 1000 - Date.now()) / 86_400_000)

    return {
      valid: Boolean(d.is_valid),
      neverExpires,
      expiresAt,
      daysRemaining,
      type: d.type,
      scopes: d.scopes,
      error: d.is_valid ? undefined : (json?.error?.message || 'Token invalide'),
    }
  } catch (e) {
    return { valid: false, neverExpires: false, expiresAt: null, daysRemaining: null, error: String(e) }
  }
}

/** Statut du token actuellement configuré (app_config → env fallback). */
export async function getTokenStatus(): Promise<IGTokenStatus> {
  const token = await getToken()
  return debugToken(token)
}
