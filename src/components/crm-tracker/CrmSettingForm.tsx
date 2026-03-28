'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { upsertCrmEntry, getCrmEntryForDate } from '@/lib/actions/crm-tracker'
import { formatDate } from '@/lib/utils'

export function CrmSettingForm() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [values, setValues] = useState({
    messages_envoyes: 0,
    reponses: 0,
    fup_envoyes: 0,
    reponses_fup: 0,
    rdv_bookes: 0,
    links_envoyes: 0,
  })

  const [isUpdate, setIsUpdate] = useState(false)
  const [submitted, setSubmitted] = useState<typeof values & { date: string } | null>(null)

  // Calcul des métriques en temps réel
  const metrics = useMemo(() => {
    const { messages_envoyes, reponses, fup_envoyes, reponses_fup, rdv_bookes, links_envoyes } = values
    return {
      pct_reponse: messages_envoyes > 0
        ? (reponses / messages_envoyes * 100).toFixed(1) + '%'
        : '\u2014',
      pct_reponse_fup: fup_envoyes > 0
        ? (reponses_fup / fup_envoyes * 100).toFixed(1) + '%'
        : '\u2014',
      pct_rdv_message: messages_envoyes > 0
        ? (rdv_bookes / messages_envoyes * 100).toFixed(1) + '%'
        : '\u2014',
      pct_rdv_reponse: (reponses + reponses_fup) > 0
        ? (rdv_bookes / (reponses + reponses_fup) * 100).toFixed(1) + '%'
        : '\u2014',
      pct_links_call: links_envoyes > 0
        ? (rdv_bookes / links_envoyes * 100).toFixed(1) + '%'
        : '\u2014',
    }
  }, [values])

  useEffect(() => {
    async function loadExisting() {
      setLoadingData(true)
      setSubmitted(null)
      const entry = await getCrmEntryForDate(date)
      if (entry) {
        setValues({
          messages_envoyes: entry.messages_envoyes,
          reponses: entry.reponses,
          fup_envoyes: entry.fup_envoyes,
          reponses_fup: entry.reponses_fup,
          rdv_bookes: entry.rdv_bookes,
          links_envoyes: entry.links_envoyes ?? 0,
        })
        setIsUpdate(true)
      } else {
        setValues({ messages_envoyes: 0, reponses: 0, fup_envoyes: 0, reponses_fup: 0, rdv_bookes: 0, links_envoyes: 0 })
        setIsUpdate(false)
      }
      setLoadingData(false)
    }
    loadExisting()
  }, [date])

  function handleFieldChange(field: keyof typeof values, val: string) {
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
    // Override with controlled values
    formData.set('messages_envoyes', String(values.messages_envoyes))
    formData.set('reponses', String(values.reponses))
    formData.set('fup_envoyes', String(values.fup_envoyes))
    formData.set('reponses_fup', String(values.reponses_fup))
    formData.set('rdv_bookes', String(values.rdv_bookes))
    formData.set('links_envoyes', String(values.links_envoyes))

    const result = await upsertCrmEntry(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast(`Stats du ${formatDate(date, 'd MMMM')} enregistr\u00e9es`, 'success')
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loadingData ? (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="date" value={date} />

            <Input
              label="Messages envoy&eacute;s"
              name="messages_envoyes"
              type="number"
              min={0}
              value={displayValue(values.messages_envoyes)}
              onChange={(e) => handleFieldChange('messages_envoyes', e.target.value)}
            />
            <Input
              label="R&eacute;ponses"
              name="reponses"
              type="number"
              min={0}
              value={displayValue(values.reponses)}
              onChange={(e) => handleFieldChange('reponses', e.target.value)}
            />
            <Input
              label="FUP envoy&eacute;s"
              name="fup_envoyes"
              type="number"
              min={0}
              value={displayValue(values.fup_envoyes)}
              onChange={(e) => handleFieldChange('fup_envoyes', e.target.value)}
            />
            <Input
              label="R&eacute;ponses FUP"
              name="reponses_fup"
              type="number"
              min={0}
              value={displayValue(values.reponses_fup)}
              onChange={(e) => handleFieldChange('reponses_fup', e.target.value)}
            />
            <Input
              label="RDV book&eacute;s"
              name="rdv_bookes"
              type="number"
              min={0}
              value={displayValue(values.rdv_bookes)}
              onChange={(e) => handleFieldChange('rdv_bookes', e.target.value)}
            />
            <Input
              label="Links call envoy&eacute;s"
              name="links_envoyes"
              type="number"
              min={0}
              value={displayValue(values.links_envoyes)}
              onChange={(e) => handleFieldChange('links_envoyes', e.target.value)}
            />

            {/* Aperçu métriques en temps réel */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <MetricPreview label="% R&eacute;ponse" value={metrics.pct_reponse} />
              <MetricPreview label="% RDV/Msg" value={metrics.pct_rdv_message} />
              <MetricPreview label="% R&eacute;p. FUP" value={metrics.pct_reponse_fup} />
              <MetricPreview label="% RDV/R&eacute;p" value={metrics.pct_rdv_reponse} />
              <MetricPreview label="% Links &rarr; Call" value={metrics.pct_links_call} />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enregistrement...' : isUpdate ? 'Mettre \u00e0 jour' : 'Enregistrer'}
            </Button>
          </form>
        )}

        {submitted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm text-green-800 font-medium">
              Stats du {formatDate(submitted.date, 'd MMMM')} enregistr&eacute;es
            </p>
            <p className="text-xs text-green-700 mt-1">
              {submitted.messages_envoyes} msg &middot; {submitted.reponses} r&eacute;p &middot; {submitted.fup_envoyes} FUP &middot; {submitted.reponses_fup} r&eacute;p FUP &middot; {submitted.rdv_bookes} RDV &middot; {submitted.links_envoyes} links
            </p>
            <p className="text-xs text-green-600 mt-1 opacity-80">
              Visible dans KINDASAMA
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricPreview({ label, value }: { label: string; value: string }) {
  const isDash = value === '\u2014'
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${isDash ? 'bg-gray-50' : 'bg-blue-50'}`}>
      <p className={`text-lg font-bold ${isDash ? 'text-gray-300' : 'text-blue-700'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
