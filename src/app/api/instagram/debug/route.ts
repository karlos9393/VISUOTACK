import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getMediaList,
  getAccountStats,
  debugToken,
  TOKEN_CONFIG_KEY,
} from '@/lib/services/instagram'

const BASE_URL = 'https://graph.facebook.com/v22.0'

/** Masque tout token présent dans la sortie (URLs de pagination Meta). */
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

  const envToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() || ''
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID

  const results: Record<string, unknown> = {}

  // --- DIAGNOSTIC SOURCES DE TOKEN ---
  // Token en base (app_config) — ce que lisent RÉELLEMENT les pages en priorité
  let dbToken = ''
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('app_config')
      .select('value')
      .eq('key', TOKEN_CONFIG_KEY)
      .single()
    dbToken = data?.value?.trim() || ''
  } catch (e) {
    results.dbReadError = String(e)
  }

  results.sources = {
    env: { present: !!envToken, length: envToken.length, valid: (await debugToken(envToken)).valid },
    db: {
      present: !!dbToken,
      length: dbToken.length,
      valid: dbToken ? (await debugToken(dbToken)).valid : null,
    },
    effectiveSource: dbToken ? 'DB (app_config)' : (envToken ? 'ENV' : 'AUCUN'),
  }

  // --- CHEMIN RÉEL DES PAGES (getToken app_config-first) ---
  const realMedia = await getMediaList()
  const realStats = await getAccountStats()
  results.realPath = {
    getMediaList_count: realMedia.length,
    getAccountStats_ok: !!realStats,
  }

  if (!envToken || !accountId) {
    results.env = { hasToken: !!envToken, hasAccountId: !!accountId }
    return NextResponse.json(sanitize(results, envToken), { status: 200 })
  }

  // --- TEST DIRECT avec l'ENV token, champs COMPLETS (comme getMediaList) ---
  try {
    const fullUrl = `${BASE_URL}/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=50&access_token=${envToken}`
    const res = await fetch(fullUrl, { cache: 'no-store' })
    const body = await res.json()
    results.fullFieldsTest = {
      status: res.status,
      count: Array.isArray(body?.data) ? body.data.length : 0,
      error: body?.error ?? null,
    }
  } catch (e) {
    results.fullFieldsTest = { error: String(e) }
  }

  return NextResponse.json(sanitize(results, envToken), { status: 200 })
}
