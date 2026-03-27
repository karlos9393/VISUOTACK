'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const revenueSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  amount: z.number().positive('Le montant doit être positif'),
  offer: z.enum(['formation', 'accompagnement', 'dfy']),
  client_name: z.string().optional(),
  payment_type: z.enum(['complet', 'acompte', 'solde']),
  notes: z.string().optional(),
})

export async function createRevenueEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const raw = {
    date: formData.get('date')?.toString() || '',
    amount: Number(formData.get('amount') || 0),
    offer: formData.get('offer')?.toString() || 'formation',
    client_name: formData.get('client_name')?.toString() || undefined,
    payment_type: formData.get('payment_type')?.toString() || 'complet',
    notes: formData.get('notes')?.toString() || undefined,
  }

  const result = revenueSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  const { error } = await supabase.from('revenue_entries').insert({
    created_by: user.id,
    ...result.data,
    client_name: result.data.client_name || null,
    notes: result.data.notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/revenue')
  revalidatePath('/')
  return { success: true }
}
