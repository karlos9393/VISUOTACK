'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const contentPostSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  platform: z.enum(['instagram', 'youtube', 'tiktok']),
  format: z.enum(['reel', 'carrousel', 'story', 'video', 'short']),
  status: z.enum(['idee', 'en_prod', 'planifie', 'publie']),
  scheduled_at: z.string().optional(),
  notes: z.string().optional(),
})

export async function createContentPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    title: formData.get('title')?.toString() || '',
    platform: formData.get('platform')?.toString() || 'instagram',
    format: formData.get('format')?.toString() || 'reel',
    status: formData.get('status')?.toString() || 'idee',
    scheduled_at: formData.get('scheduled_at')?.toString() || undefined,
    notes: formData.get('notes')?.toString() || undefined,
  }

  const result = contentPostSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  const insertData: Record<string, unknown> = {
    created_by: user.id,
    title: result.data.title,
    platform: result.data.platform,
    format: result.data.format,
    status: result.data.status,
    notes: result.data.notes || null,
  }

  if (result.data.scheduled_at) {
    insertData.scheduled_at = result.data.scheduled_at
  }

  if (result.data.status === 'publie') {
    insertData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('content_posts').insert(insertData)
  if (error) return { error: error.message }

  revalidatePath('/contenu/calendrier')
  revalidatePath('/contenu/performance')
  return { success: true }
}

export async function updateContentPost(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    title: formData.get('title')?.toString() || '',
    platform: formData.get('platform')?.toString() || 'instagram',
    format: formData.get('format')?.toString() || 'reel',
    status: formData.get('status')?.toString() || 'idee',
    scheduled_at: formData.get('scheduled_at')?.toString() || undefined,
    notes: formData.get('notes')?.toString() || undefined,
  }

  const result = contentPostSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  const updateData: Record<string, unknown> = {
    title: result.data.title,
    platform: result.data.platform,
    format: result.data.format,
    status: result.data.status,
    scheduled_at: result.data.scheduled_at || null,
    notes: result.data.notes || null,
  }

  if (result.data.status === 'publie') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('content_posts').update(updateData).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/contenu/calendrier')
  revalidatePath('/contenu/performance')
  return { success: true }
}

export async function updatePostStats(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('content_posts')
    .update({
      views: Number(formData.get('views') || 0),
      likes: Number(formData.get('likes') || 0),
      comments: Number(formData.get('comments') || 0),
      followers_gained: Number(formData.get('followers_gained') || 0),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/contenu/performance')
  return { success: true }
}
