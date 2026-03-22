import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshLongLivedToken } from '@/lib/services/instagram'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  // Lire le token actuel depuis app_config
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'meta_instagram_access_token')
    .single()

  const currentToken = config?.value || process.env.META_INSTAGRAM_ACCESS_TOKEN || ''

  if (!currentToken) {
    return NextResponse.json({ error: 'Aucun token à rafraîchir' }, { status: 400 })
  }

  const newToken = await refreshLongLivedToken(currentToken)

  if (!newToken) {
    return NextResponse.json({ error: 'Échec du rafraîchissement du token' }, { status: 502 })
  }

  // Sauvegarder le nouveau token dans app_config
  const { error } = await supabase
    .from('app_config')
    .upsert({
      key: 'meta_instagram_access_token',
      value: newToken,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Token Meta rafraîchi avec succès',
    refreshed_at: new Date().toISOString(),
  })
}
