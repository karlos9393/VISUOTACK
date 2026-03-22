'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { createRevenueEntry } from '@/lib/actions/revenue'

export function RevenueForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await createRevenueEntry(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast('Vente enregistrée', 'success')
  }

  return (
    <Card>
      <CardTitle>Saisir une vente</CardTitle>
      <form action={handleSubmit} className="mt-4 space-y-3">
        <Input
          label="Date"
          name="date"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
        <Input
          label="Montant (€)"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
        />
        <Select
          label="Offre"
          name="offer"
          options={[
            { value: 'formation', label: 'Formation' },
            { value: 'accompagnement', label: 'Accompagnement' },
            { value: 'dfy', label: 'DFY (Done For You)' },
          ]}
        />
        <Input
          label="Nom du client"
          name="client_name"
        />
        <Select
          label="Type de paiement"
          name="payment_type"
          options={[
            { value: 'complet', label: 'Paiement complet' },
            { value: 'acompte', label: 'Acompte' },
            { value: 'solde', label: 'Solde' },
          ]}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer la vente'}
        </Button>
      </form>
    </Card>
  )
}
