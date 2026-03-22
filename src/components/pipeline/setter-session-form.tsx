'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { upsertSetterLog, getSetterLogForDate } from '@/lib/actions/setter-logs'
import { formatDate } from '@/lib/utils'

export function SetterSessionForm() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [values, setValues] = useState({
    conversations: 0,
    qualified: 0,
    links_sent: 0,
    calls_booked: 0,
    notes: '',
  })

  const [isUpdate, setIsUpdate] = useState(false)

  useEffect(() => {
    async function loadExisting() {
      setLoadingData(true)
      const log = await getSetterLogForDate(date)
      if (log) {
        setValues({
          conversations: log.conversations,
          qualified: log.qualified,
          links_sent: log.links_sent,
          calls_booked: log.calls_booked,
          notes: log.notes || '',
        })
        setIsUpdate(true)
      } else {
        setValues({ conversations: 0, qualified: 0, links_sent: 0, calls_booked: 0, notes: '' })
        setIsUpdate(false)
      }
      setLoadingData(false)
    }
    loadExisting()
  }, [date])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    formData.set('date', date)
    const result = await upsertSetterLog(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast(`Session du ${formatDate(date)} enregistrée`, 'success')
    setIsUpdate(true)
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Session du</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loadingData ? (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="date" value={date} />
            <Input
              label="Conversations actives"
              name="conversations"
              type="number"
              min={0}
              defaultValue={values.conversations}
              key={`conv-${date}-${values.conversations}`}
              required
            />
            <Input
              label="Profils qualifiés"
              name="qualified"
              type="number"
              min={0}
              defaultValue={values.qualified}
              key={`qual-${date}-${values.qualified}`}
              required
            />
            <Input
              label="Liens de booking envoyés"
              name="links_sent"
              type="number"
              min={0}
              defaultValue={values.links_sent}
              key={`links-${date}-${values.links_sent}`}
              required
            />
            <Input
              label="Calls bookés"
              name="calls_booked"
              type="number"
              min={0}
              defaultValue={values.calls_booked}
              key={`booked-${date}-${values.calls_booked}`}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={values.notes}
                key={`notes-${date}-${values.notes}`}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Quelque chose à signaler..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : isUpdate ? 'Mettre à jour la session' : 'Enregistrer la session'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
