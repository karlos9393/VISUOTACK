'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { upsertCrmEntry, getCrmEntryForDate } from '@/lib/actions/crm-tracker'
import { formatDate } from '@/lib/utils'
import { KPI_DEFS, computeAllKpis, formatKpi } from '@/lib/crm-kpi'

const INITIAL_VALUES = {
  conversations_entrantes: 0,
  outbound_envoyes: 0,
  reponses_outbound: 0,
  fup_envoyes: 0,
  reponses_fup: 0,
  liens_rdv_envoyes: 0,
  rdv_bookes: 0,
  rdv_qualifies: 0,
}

type Values = typeof INITIAL_VALUES

// Champs entiers dans l'ordre d'affichage demandé.
const FIELDS: { key: keyof Values; label: string }[] = [
  { key: 'conversations_entrantes', label: 'Nouvelles conversations entrantes' },
  { key: 'outbound_envoyes', label: 'Outbound envoyés' },
  { key: 'reponses_outbound', label: 'Réponses aux outbound' },
  { key: 'fup_envoyes', label: 'FUP envoyés (anciens leads relancés)' },
  { key: 'reponses_fup', label: 'Réponses aux FUP' },
  { key: 'liens_rdv_envoyes', label: 'Lien RDV envoyé' },
  { key: 'rdv_bookes', label: 'RDV bookés' },
  { key: 'rdv_qualifies', label: 'RDV qualifiés' },
]

export function CrmSettingForm() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [values, setValues] = useState<Values>(INITIAL_VALUES)
  const [setterPresent, setSetterPresent] = useState(true)
  const [notes, setNotes] = useState('')

  const [isUpdate, setIsUpdate] = useState(false)
  const [submitted, setSubmitted] = useState<(Values & { date: string }) | null>(null)

  // Aperçu des KPI en temps réel (source unique : crm-kpi.ts)
  const kpis = useMemo(() => computeAllKpis(values), [values])

  useEffect(() => {
    async function loadExisting() {
      setLoadingData(true)
      setSubmitted(null)
      const entry = await getCrmEntryForDate(date)
      if (entry) {
        setValues({
          conversations_entrantes: entry.conversations_entrantes ?? 0,
          outbound_envoyes: entry.outbound_envoyes ?? 0,
          reponses_outbound: entry.reponses_outbound ?? 0,
          fup_envoyes: entry.fup_envoyes ?? 0,
          reponses_fup: entry.reponses_fup ?? 0,
          liens_rdv_envoyes: entry.liens_rdv_envoyes ?? 0,
          rdv_bookes: entry.rdv_bookes ?? 0,
          rdv_qualifies: entry.rdv_qualifies ?? 0,
        })
        setSetterPresent(entry.setter_present ?? true)
        setNotes(entry.notes ?? '')
        setIsUpdate(true)
      } else {
        setValues(INITIAL_VALUES)
        setSetterPresent(true)
        setNotes('')
        setIsUpdate(false)
      }
      setLoadingData(false)
    }
    loadExisting()
  }, [date])

  function handleFieldChange(field: keyof Values, val: string) {
    const parsed = val === '' ? 0 : parseInt(val, 10)
    setValues((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : Math.max(0, parsed) }))
  }

  function displayValue(val: number): string {
    return val === 0 ? '' : String(val)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    formData.set('date', date)
    for (const { key } of FIELDS) {
      formData.set(key, String(values[key]))
    }
    formData.set('setter_present', setterPresent ? 'true' : 'false')
    formData.set('notes', notes)

    const result = await upsertCrmEntry(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast(`Stats du ${formatDate(date, 'd MMMM')} enregistrées`, 'success')
    setIsUpdate(true)
    setSubmitted({ ...values, date })
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Setting CRM du
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {loadingData ? (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="date" value={date} />

            {FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                name={key}
                type="number"
                min={0}
                value={displayValue(values[key])}
                onChange={(e) => handleFieldChange(key, e.target.value)}
              />
            ))}

            {/* Setter présent — toggle oui/non */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setter présent
              </label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSetterPresent(true)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    setterPresent ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setSetterPresent(false)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    !setterPresent ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            {/* Notes / incidents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / incidents
              </label>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Ex. journée off, bug outil, absence..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* Aperçu KPI en temps réel */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              {KPI_DEFS.map((def) => (
                <MetricPreview key={def.key} label={def.label} value={formatKpi(kpis[def.key])} />
              ))}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : isUpdate ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </form>
        )}

        {submitted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-800 font-medium">
              Stats du {formatDate(submitted.date, 'd MMMM')} enregistr&eacute;es
            </p>
            <p className="text-xs text-green-700 mt-1">
              {submitted.conversations_entrantes} conv &middot; {submitted.outbound_envoyes} outbound &middot; {submitted.reponses_outbound} r&eacute;p &middot; {submitted.rdv_bookes} RDV &middot; {submitted.rdv_qualifies} qualif
            </p>
            <p className="text-xs text-green-600 mt-1 opacity-80">
              Visible dans SUIVI SETTING
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricPreview({ label, value }: { label: string; value: string }) {
  const isDash = value === '—'
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${isDash ? 'bg-gray-50' : 'bg-primary-soft'}`}>
      <p className={`text-lg font-bold ${isDash ? 'text-gray-300' : 'text-primary'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
