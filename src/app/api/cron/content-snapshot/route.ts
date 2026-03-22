import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfWeek, endOfWeek } from 'date-fns'

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

  // Agréger les posts publiés de la semaine
  const { data: posts } = await supabase
    .from('content_posts')
    .select('id, views, followers_gained')
    .eq('status', 'publie')
    .gte('published_at', format(weekStart, 'yyyy-MM-dd'))
    .lte('published_at', format(weekEnd, 'yyyy-MM-dd'))

  const weekPosts = posts || []
  const totalViews = weekPosts.reduce((s, p) => s + p.views, 0)
  const totalFollowers = weekPosts.reduce((s, p) => s + p.followers_gained, 0)
  const bestPost = weekPosts.length > 0
    ? weekPosts.reduce((best, p) => p.views > best.views ? p : best, weekPosts[0])
    : null

  const { error } = await supabase
    .from('content_weekly_snapshots')
    .insert({
      week_start: weekStartStr,
      posts_published: weekPosts.length,
      total_views: totalViews,
      followers_gained: totalFollowers,
      best_post_id: bestPost?.id || null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Snapshot créé',
    posts_published: weekPosts.length,
    total_views: totalViews,
  })
}
