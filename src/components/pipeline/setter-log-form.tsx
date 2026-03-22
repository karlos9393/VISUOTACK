'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { upsertSetterLog } from '@/lib/actions/setter-logs'
import type { SetterLog } from '@/lib/types'

interface SetterLogFormProps {
  existingLog: SetterLog | null
}

export function SetterLogForm({ existingLog }: SetterLogFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await upsertSetterLog(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast('Log enregistré pour aujourd\'hui', 'success')
  }

  return (
    <Card className="max-w-lg">
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            label="Conversations actives"
            name="conversations"
            type="number"
            min={0}
            defaultValue={existingLog?.conversations || 0}
            required
          />
          <Input
            label="Profils qualifiés"
            name="qualified"
            type="number"
            min={0}
            defaultValue={existingLog?.qualified || 0}
            required
          />
          <Input
            label="Liens de booking envoyés"
            name="links_sent"
            type="number"
            min={0}
            defaultValue={existingLog?.links_sent || 0}
            required
          />
          <Input
            label="Calls bookés"
            name="calls_booked"
            type="number"
            min={0}
            defaultValue={existingLog?.calls_booked || 0}
            required
          />
          <Input
            label="Calls honorés"
            name="calls_shown"
            type="number"
            min={0}
            defaultValue={existingLog?.calls_shown || 0}
            required
          />
          <Input
            label="Closes"
            name="closes"
            type="number"
            min={0}
            defaultValue={existingLog?.closes || 0}
            required
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Raisons de non-close</p>
          <div className="space-y-3">
            <Input
              label="Pas le budget"
              name="no_close_budget"
              type="number"
              min={0}
              defaultValue={existingLog?.no_close_budget || 0}
            />
            <Input
              label="Besoin de réfléchir"
              name="no_close_think"
              type="number"
              min={0}
              defaultValue={existingLog?.no_close_think || 0}
            />
            <Input
              label="Pas convaincu"
              name="no_close_trust"
              type="number"
              min={0}
              defaultValue={existingLog?.no_close_trust || 0}
            />
            <Input
              label="Concurrent"
              name="no_close_competitor"
              type="number"
              min={0}
              defaultValue={existingLog?.no_close_competitor || 0}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={existingLog?.notes || ''}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Signale un cas particulier..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enregistrement...' : existingLog ? 'Mettre à jour le log' : 'Enregistrer le log'}
        </Button>
      </form>
    </Card>
  )
}
