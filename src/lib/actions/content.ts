'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
