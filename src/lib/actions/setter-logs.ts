'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const setterLogSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  conversations: z.number().min(0),
  qualified: z.number().min(0),
  links_sent: z.number().min(0),
  calls_booked: z.number().min(0),
  notes: z.string().optional(),
})

export async function upsertSetterLog(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    date: formData.get('date')?.toString() || '',
    conversations: Number(formData.get('conversations') || 0),
    qualified: Number(formData.get('qualified') || 0),
    links_sent: Number(formData.get('links_sent') || 0),
    calls_booked: Number(formData.get('calls_booked') || 0),
    notes: formData.get('notes')?.toString() || '',
  }

  const result = setterLogSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('setter_logs')
    .upsert(
      {
        user_id: user.id,
        date: result.data.date,
        conversations: result.data.conversations,
        qualified: result.data.qualified,
        links_sent: result.data.links_sent,
        calls_booked: result.data.calls_booked,
        calls_shown: 0,
        closes: 0,
        no_close_budget: 0,
        no_close_think: 0,
        no_close_trust: 0,
        no_close_competitor: 0,
        notes: result.data.notes || null,
      },
      { onConflict: 'user_id,date' }
    )

  if (error) return { error: error.message }

  revalidatePath('/pipeline/setting')
  revalidatePath('/pipeline')
  revalidatePath('/')
  return { success: true, date: result.data.date, message: 'Setting du jour enregistré ✓' }
}

export async function getSetterLogForDate(date: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('setter_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  return data
}

export async function updateSetterLogInline(logDate: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('setter_logs')
    .update({
      conversations: Number(formData.get('conversations') || 0),
      qualified: Number(formData.get('qualified') || 0),
      links_sent: Number(formData.get('links_sent') || 0),
      calls_booked: Number(formData.get('calls_booked') || 0),
    })
    .eq('user_id', user.id)
    .eq('date', logDate)

  if (error) return { error: error.message }

  revalidatePath('/pipeline')
  return { success: true }
}
