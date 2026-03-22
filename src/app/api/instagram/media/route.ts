import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMediaList } from '@/lib/services/instagram'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const media = await getMediaList()
  return NextResponse.json({ data: media })
}
