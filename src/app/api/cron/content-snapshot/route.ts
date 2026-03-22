import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { getAccountStats, getMediaList } from '@/lib/services/instagram'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  // Vérifier si le snapshot existe déjà
  const { data: existing } = await supabase
    .from('content_weekly_snapshots')
    .select('id')
    .eq('week_start', weekStartStr)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Snapshot déjà existant' })
  }

  // Données live depuis l'API Instagram
  const [accountStats, mediaList] = await Promise.all([
    getAccountStats(),
    getMediaList(),
  ])

  // Filtrer les posts de la semaine
  const weekPosts = mediaList.filter(m => {
    const d = new Date(m.timestamp)
    return d >= weekStart && d <= weekEnd
  })

  const totalLikes = weekPosts.reduce((s, p) => s + (p.like_count || 0), 0)
  const totalComments = weekPosts.reduce((s, p) => s + (p.comments_count || 0), 0)

  // Best post = celui avec le plus de likes
  const bestPost = weekPosts.length > 0
    ? weekPosts.reduce((best, p) => (p.like_count || 0) > (best.like_count || 0) ? p : best, weekPosts[0])
    : null

  const { error } = await supabase
    .from('content_weekly_snapshots')
    .insert({
      week_start: weekStartStr,
      posts_published: weekPosts.length,
      total_views: totalLikes + totalComments,
      followers_start: accountStats?.followers_count || 0,
      followers_end: accountStats?.followers_count || 0,
      followers_gained: 0,
      best_post_id: bestPost?.id || null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Snapshot Instagram créé',
    posts_published: weekPosts.length,
    followers: accountStats?.followers_count || 0,
  })
}
