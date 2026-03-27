import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostsForPeriod, getMediaInsights } from '@/lib/services/instagram'
import type { IGMedia, IGMediaInsights } from '@/lib/services/instagram'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (!rateLimit(user.id, 5, 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const sp = request.nextUrl.searchParams
  const startA = sp.get('startA')
  const endA = sp.get('endA')
  const startB = sp.get('startB')
  const endB = sp.get('endB')

  if (!startA || !endA || !startB || !endB) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Fetch posts des deux périodes en parallèle
  const [postsA, postsB] = await Promise.all([
    getPostsForPeriod(new Date(startA), new Date(endA)),
    getPostsForPeriod(new Date(startB), new Date(endB)),
  ])

  // Dédupliquer les posts pour ne pas fetch les insights deux fois
  const uniqueMap = new Map<string, IGMedia>()
  for (const p of [...postsA, ...postsB]) {
    uniqueMap.set(p.id, p)
  }

  // Batch fetch insights (groupes de 5)
  const insightsMap: Record<string, IGMediaInsights> = {}
  const uniquePosts = Array.from(uniqueMap.values())

  for (let i = 0; i < uniquePosts.length; i += 5) {
    const batch = uniquePosts.slice(i, i + 5)
    const results = await Promise.all(
      batch.map(async (post) => {
        const data = await getMediaInsights(post.id, post.media_type)
        return { id: post.id, data }
      })
    )
    for (const r of results) {
      insightsMap[r.id] = r.data
    }
  }

  // Split insights par période
  const insightsA: Record<string, IGMediaInsights> = {}
  const insightsB: Record<string, IGMediaInsights> = {}

  for (const p of postsA) {
    if (insightsMap[p.id]) insightsA[p.id] = insightsMap[p.id]
  }
  for (const p of postsB) {
    if (insightsMap[p.id]) insightsB[p.id] = insightsMap[p.id]
  }

  return NextResponse.json({
    periodA: { posts: postsA, insights: insightsA },
    periodB: { posts: postsB, insights: insightsB },
  })
}
