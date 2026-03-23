'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { updateSetterLogInline, deleteSetterLog } from '@/lib/actions/setter-logs'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DayEntry {
  date: string
  dayName: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
  notes?: string
  user_id?: string | null
}

interface EditLogModalProps {
  day: DayEntry
  onClose: () => void
}

export function EditLogModal({ day, onClose }: EditLogModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  async function handleSave(formData: FormData) {
    setLoading(true)
    const result = await updateSetterLogInline(day.date, formData)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Log mis à jour', 'success')
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce log ? Cette action est irréversible.')) return
    setDeleting(true)
    const userId = day.user_id
    if (!userId) {
      toast('Impossible de supprimer : user_id manquant', 'error')
      setDeleting(false)
      return
    }
    const result = await deleteSetterLog(day.date, userId)
    setDeleting(false)
    if (result.error) {
      toast(result.error, 'error')
      return
    }
    toast('Log supprimé', 'success')
    onClose()
  }

  const dateLabel = format(parseISO(day.date), 'd MMMM', { locale: fr })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        minHeight: '100%',
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">
            Modifier le log du {dateLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form action={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Conv. actives"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={day.notes || ''}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
