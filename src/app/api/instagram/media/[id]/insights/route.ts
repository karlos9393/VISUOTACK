import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMediaInsights } from '@/lib/services/instagram'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const mediaType = request.nextUrl.searchParams.get('media_type') || 'IMAGE'
  const insights = await getMediaInsights(params.id, mediaType)

  return NextResponse.json(insights)
}
