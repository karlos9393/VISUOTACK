import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountStats, getAccountInsights } from '@/lib/services/instagram'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!rateLimit(user.id, 10, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const since = request.nextUrl.searchParams.get('since')
  const until = request.nextUrl.searchParams.get('until')

  // Si since/until fournis → retourner les insights par jour
  if (since && until) {
    const insights = await getAccountInsights(since, until)
    return NextResponse.json({ data: insights })
  }

  // Sinon → stats globales du compte
  const stats = await getAccountStats()
  if (!stats) {
    return NextResponse.json({ error: 'Impossible de récupérer les stats Instagram' }, { status: 502 })
  }

  return NextResponse.json(stats)
}
