'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, subDays, startOfWeek, subWeeks } from 'date-fns'
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

export async function deleteSetterLog(logDate: string, logUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('setter_logs')
    .delete()
    .eq('user_id', logUserId)
    .eq('date', logDate)

  if (error) return { error: error.message }

  revalidatePath('/pipeline')
  revalidatePath('/pipeline/setting')
  return { success: true }
}

export interface SetterStats {
  thisWeek: { conversations: number; qualified: number; links_sent: number; calls_booked: number }
  lastWeek: { conversations: number; qualified: number; links_sent: number; calls_booked: number }
  linksDelta: number | null
  streak: number
}

export async function getSetterStats(): Promise<SetterStats | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = subWeeks(weekStart, 1)
  const lastWeekEnd = subDays(weekStart, 1)

  // Semaine en cours + semaine précédente en parallèle
  const [thisWeekRes, lastWeekRes, streakRes] = await Promise.all([
    supabase
      .from('setter_logs')
      .select('conversations, qualified, links_sent, calls_booked')
      .eq('user_id', user.id)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(now, 'yyyy-MM-dd')),
    supabase
      .from('setter_logs')
      .select('conversations, qualified, links_sent, calls_booked')
      .eq('user_id', user.id)
      .gte('date', format(lastWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(lastWeekEnd, 'yyyy-MM-dd')),
    supabase
      .from('setter_logs')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30),
  ])

  const sum = (logs: typeof thisWeekRes.data) =>
    (logs || []).reduce(
      (acc, l) => ({
        conversations: acc.conversations + (l.conversations ?? 0),
        qualified: acc.qualified + (l.qualified ?? 0),
        links_sent: acc.links_sent + (l.links_sent ?? 0),
        calls_booked: acc.calls_booked + (l.calls_booked ?? 0),
      }),
      { conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0 }
    )

  const thisWeek = sum(thisWeekRes.data)
  const lastWeek = sum(lastWeekRes.data)

  const linksDelta = lastWeek.links_sent === 0
    ? null
    : Math.round(((thisWeek.links_sent - lastWeek.links_sent) / lastWeek.links_sent) * 100)

  // Calcul série
  let streak = 0
  const logs = streakRes.data || []
  if (logs.length > 0) {
    let checkDate = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    if (logs[0].date !== todayStr) {
      checkDate = subDays(checkDate, 1)
    }
    for (const log of logs) {
      if (log.date === format(checkDate, 'yyyy-MM-dd')) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }
  }

  return { thisWeek, lastWeek, linksDelta, streak }
}
