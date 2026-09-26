import { NextResponse } from 'next/server'
import { getMediaList } from '@/lib/services/instagram'
import { rateLimit } from '@/lib/rate-limit'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!rateLimit(user.id, 10, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const media = await getMediaList()
  return NextResponse.json({ data: media })
}
