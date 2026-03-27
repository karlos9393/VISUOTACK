'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const crmEntrySchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  messages_envoyes: z.number().min(0),
  reponses: z.number().min(0),
  fup_envoyes: z.number().min(0),
  reponses_fup: z.number().min(0),
  rdv_bookes: z.number().min(0),
})

export async function upsertCrmEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    date: formData.get('date')?.toString() || '',
    messages_envoyes: Number(formData.get('messages_envoyes') || 0),
    reponses: Number(formData.get('reponses') || 0),
    fup_envoyes: Number(formData.get('fup_envoyes') || 0),
    reponses_fup: Number(formData.get('reponses_fup') || 0),
    rdv_bookes: Number(formData.get('rdv_bookes') || 0),
  }

  const result = crmEntrySchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('crm_daily_entries')
    .upsert(
      {
        setter_id: user.id,
        date: result.data.date,
        messages_envoyes: result.data.messages_envoyes,
        reponses: result.data.reponses,
        fup_envoyes: result.data.fup_envoyes,
        reponses_fup: result.data.reponses_fup,
        rdv_bookes: result.data.rdv_bookes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'setter_id,date' }
    )

  if (error) return { error: error.message }

  revalidatePath('/crm-tracker')
  revalidatePath('/crm-tracker/setting')
  revalidatePath('/crm-tracker')
  return { success: true, date: result.data.date }
}

export async function upsertCrmEntryInline(
  setterId: string,
  date: string,
  field: string,
  value: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que l'utilisateur modifie ses propres données (ou est admin)
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (user.id !== setterId && !['admin', 'manager'].includes(profile?.role || '')) {
    return { error: 'Non autorisé' }
  }

  const validFields = ['messages_envoyes', 'reponses', 'fup_envoyes', 'reponses_fup', 'rdv_bookes']
  if (!validFields.includes(field)) {
    return { error: 'Champ invalide' }
  }

  // Upsert : crée l'entrée si elle n'existe pas, sinon met à jour le champ
  const { data: existing } = await supabase
    .from('crm_daily_entries')
    .select('id')
    .eq('setter_id', setterId)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('crm_daily_entries')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('setter_id', setterId)
      .eq('date', date)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('crm_daily_entries')
      .insert({
        setter_id: setterId,
        date,
        [field]: value,
        updated_at: new Date().toISOString(),
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/crm-tracker')
  revalidatePath('/crm-tracker')
  return { success: true }
}

export async function getCrmEntriesForMonth(year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

  const { data } = await supabase
    .from('crm_daily_entries')
    .select('*, updater:updated_by(full_name, email)')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })

  return data || []
}

export async function getCrmEntriesForDateRange(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('crm_daily_entries')
    .select('*, updater:updated_by(full_name, email)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  return data || []
}

export async function getCrmEntryForDate(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('crm_daily_entries')
    .select('*')
    .eq('setter_id', user.id)
    .eq('date', date)
    .single()

  return data
}

export async function getSetters() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('users')
    .select('id, full_name, email, role')
    .in('role', ['setter', 'manager', 'admin'])
    .order('full_name', { ascending: true })

  return data || []
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single()

  return data
}
