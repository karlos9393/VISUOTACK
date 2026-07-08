import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  refreshLongLivedToken,
  debugToken,
  invalidateTokenCache,
  TOKEN_CONFIG_KEY,
  TOKEN_EXPIRY_CONFIG_KEY,
} from '@/lib/services/instagram'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  // Lire le token actuel depuis app_config (fallback env var)
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', TOKEN_CONFIG_KEY)
    .single()

  const currentToken = config?.value?.trim() || process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() || ''

  if (!currentToken) {
    return NextResponse.json({ error: 'Aucun token à rafraîchir' }, { status: 400 })
  }

  // Diagnostiquer l'état actuel du token
  const status = await debugToken(currentToken)

  // Token System User "Never" → rien à rafraîchir, on note juste qu'il n'expire pas
  if (status.valid && status.neverExpires) {
    await supabase.from('app_config').upsert(
      { key: TOKEN_EXPIRY_CONFIG_KEY, value: 'never', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    return NextResponse.json({ message: 'Token permanent (System User), aucun refresh nécessaire' })
  }

  // Sinon : tenter un renouvellement via fb_exchange_token
  const newToken = await refreshLongLivedToken(currentToken)

  if (!newToken) {
    return NextResponse.json({ error: 'Échec du rafraîchissement du token', status }, { status: 502 })
  }

  // Recalculer l'expiration du nouveau token
  const newStatus = await debugToken(newToken)
  const expiryValue = newStatus.neverExpires ? 'never' : (newStatus.expiresAt || '')

  // Sauvegarder token + expiration
  const { error } = await supabase.from('app_config').upsert(
    [
      { key: TOKEN_CONFIG_KEY, value: newToken, updated_at: new Date().toISOString() },
      { key: TOKEN_EXPIRY_CONFIG_KEY, value: expiryValue, updated_at: new Date().toISOString() },
    ],
    { onConflict: 'key' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Purger le cache mémoire pour que la nouvelle valeur soit prise en compte immédiatement
  invalidateTokenCache()

  return NextResponse.json({
    message: 'Token Meta rafraîchi avec succès',
    expires_at: expiryValue,
    days_remaining: newStatus.daysRemaining,
    refreshed_at: new Date().toISOString(),
  })
}
