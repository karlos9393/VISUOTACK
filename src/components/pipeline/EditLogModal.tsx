'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { updateSetterLogInline } from '@/lib/actions/setter-logs'

interface DayEntry {
  date: string
  dayName: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
}

interface EditLogModalProps {
  day: DayEntry
  onClose: () => void
}

export function EditLogModal({ day, onClose }: EditLogModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSave(formData: FormData) {
    setLoading(true)
    const result = await updateSetterLogInline(day.date, formData)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Setting mis à jour', 'success')
    onClose()
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 capitalize">
          Modifier — {day.dayName}
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          ✕
        </button>
      </div>
      <form action={handleSave} className="grid grid-cols-2 gap-3">
        <Input
          label="Conversations"
          name="conversations"
          type="number"
          min={0}
          defaultValue={day.conversations}
        />
        <Input
          label="Qualifiés"
          name="qualified"
          type="number"
          min={0}
          defaultValue={day.qualified}
        />
        <Input
          label="Liens envoyés"
          name="links_sent"
          type="number"
          min={0}
          defaultValue={day.links_sent}
        />
        <Input
          label="Calls bookés"
          name="calls_booked"
          type="number"
          min={0}
          defaultValue={day.calls_booked}
        />
        <div className="col-span-2 flex items-center gap-2 pt-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}
