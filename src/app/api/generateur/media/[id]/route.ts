import { NextResponse, NextRequest } from 'next/server'
import { getMediaById } from '@/lib/services/instagram'
import { rateLimit } from '@/lib/rate-limit'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  if (!rateLimit(user.id, 60, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  // media_url FRAIS (non expiré) pour CE média précis
  const media = await getMediaById(id)
  if (!media) {
    return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })
  }

  return NextResponse.json(media, { headers: { 'Cache-Control': 'no-store' } })
}
