import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccountStats } from '@/lib/services/instagram'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const stats = await getAccountStats()
  if (!stats) {
    return NextResponse.json({ error: 'Impossible de récupérer les stats Instagram' }, { status: 502 })
  }

  return NextResponse.json(stats)
}
