'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const crmEntrySchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  conversations_entrantes: z.number().int().min(0),
  outbound_envoyes: z.number().int().min(0),
  reponses_outbound: z.number().int().min(0),
  fup_envoyes: z.number().int().min(0),
  reponses_fup: z.number().int().min(0),
  liens_rdv_envoyes: z.number().int().min(0),
  rdv_bookes: z.number().int().min(0),
  rdv_qualifies: z.number().int().min(0),
  setter_present: z.boolean(),
  notes: z.string().max(2000).nullable(),
})

export async function upsertCrmEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const notesRaw = formData.get('notes')?.toString().trim() || ''
  const raw = {
    date: formData.get('date')?.toString() || '',
    conversations_entrantes: Number(formData.get('conversations_entrantes') || 0),
    outbound_envoyes: Number(formData.get('outbound_envoyes') || 0),
    reponses_outbound: Number(formData.get('reponses_outbound') || 0),
    fup_envoyes: Number(formData.get('fup_envoyes') || 0),
    reponses_fup: Number(formData.get('reponses_fup') || 0),
    liens_rdv_envoyes: Number(formData.get('liens_rdv_envoyes') || 0),
    rdv_bookes: Number(formData.get('rdv_bookes') || 0),
    rdv_qualifies: Number(formData.get('rdv_qualifies') || 0),
    setter_present: formData.get('setter_present') === 'true',
    notes: notesRaw === '' ? null : notesRaw,
  }

  const result = crmEntrySchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  // Donnée partagée : une seule entrée par date, on upsert sur le conflit date
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('crm_daily_entries')
    .select('id')
    .eq('date', result.data.date)
    .single()

  const now = new Date().toISOString()
  const values = {
    conversations_entrantes: result.data.conversations_entrantes,
    outbound_envoyes: result.data.outbound_envoyes,
    reponses_outbound: result.data.reponses_outbound,
    fup_envoyes: result.data.fup_envoyes,
    reponses_fup: result.data.reponses_fup,
    liens_rdv_envoyes: result.data.liens_rdv_envoyes,
    rdv_bookes: result.data.rdv_bookes,
    rdv_qualifies: result.data.rdv_qualifies,
    setter_present: result.data.setter_present,
    notes: result.data.notes,
    updated_at: now,
    updated_by: user.id,
  }

  if (existing) {
    const { error } = await adminClient
      .from('crm_daily_entries')
      .update(values)
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await adminClient
      .from('crm_daily_entries')
      .insert({ setter_id: user.id, date: result.data.date, ...values })
    if (error) return { error: error.message }
  }

  revalidatePath('/crm-tracker')
  revalidatePath('/crm-tracker/setting')
  return { success: true, date: result.data.date }
}

export async function upsertCrmEntryInline(
  date: string,
  field: string,
  value: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const validFields = [
    'conversations_entrantes',
    'outbound_envoyes',
    'reponses_outbound',
    'fup_envoyes',
    'reponses_fup',
    'liens_rdv_envoyes',
    'rdv_bookes',
    'rdv_qualifies',
  ]
  if (!validFields.includes(field)) {
    return { error: 'Champ invalide' }
  }

  // Donnée partagée : une seule entrée par date
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('crm_daily_entries')
    .select('id')
    .eq('date', date)
    .single()

  const now = new Date().toISOString()

  if (existing) {
    const { error } = await adminClient
      .from('crm_daily_entries')
      .update({ [field]: value, updated_at: now, updated_by: user.id })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await adminClient
      .from('crm_daily_entries')
      .insert({
        setter_id: user.id,
        date,
        [field]: value,
        updated_at: now,
        updated_by: user.id,
      })
    if (error) return { error: error.message }
  }

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
