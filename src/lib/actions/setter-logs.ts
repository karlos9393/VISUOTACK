'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const setterLogSchema = z.object({
  conversations: z.number().min(0),
  qualified: z.number().min(0),
  links_sent: z.number().min(0),
  calls_booked: z.number().min(0),
  calls_shown: z.number().min(0),
  closes: z.number().min(0),
  no_close_budget: z.number().min(0),
  no_close_think: z.number().min(0),
  no_close_trust: z.number().min(0),
  no_close_competitor: z.number().min(0),
  notes: z.string().optional(),
}).refine((data) => data.calls_shown <= data.calls_booked, {
  message: 'Calls honorés ne peut pas dépasser calls bookés',
  path: ['calls_shown'],
}).refine((data) => data.closes <= data.calls_shown, {
  message: 'Closes ne peut pas dépasser calls honorés',
  path: ['closes'],
})

export async function upsertSetterLog(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    conversations: Number(formData.get('conversations') || 0),
    qualified: Number(formData.get('qualified') || 0),
    links_sent: Number(formData.get('links_sent') || 0),
    calls_booked: Number(formData.get('calls_booked') || 0),
    calls_shown: Number(formData.get('calls_shown') || 0),
    closes: Number(formData.get('closes') || 0),
    no_close_budget: Number(formData.get('no_close_budget') || 0),
    no_close_think: Number(formData.get('no_close_think') || 0),
    no_close_trust: Number(formData.get('no_close_trust') || 0),
    no_close_competitor: Number(formData.get('no_close_competitor') || 0),
    notes: formData.get('notes')?.toString() || '',
  }

  const result = setterLogSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('setter_logs')
    .upsert(
      {
        user_id: user.id,
        date: today,
        ...result.data,
      },
      { onConflict: 'user_id,date' }
    )

  if (error) return { error: error.message }

  revalidatePath('/pipeline/log')
  revalidatePath('/pipeline')
  revalidatePath('/')
  return { success: true }
}

export async function getSetterLogToday() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('setter_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return data
}

export async function getSetterLogsForWeek(weekStart: string, weekEnd: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('setter_logs')
    .select('*, users(full_name)')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  return data || []
}
