'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

type Sort = 'date' | 'views'

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState<Sort>('date')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function fetchCsv(): Promise<Blob | null> {
    setLoading(true)
    try {
      const res = await fetch(`/api/generateur/export?sort=${sort}`)
      if (!res.ok) {
        toast("Échec de l'export", 'error')
        return null
      }
      return await res.blob()
    } catch {
      toast("Échec de l'export", 'error')
      return null
    } finally {
      setLoading(false)
    }
  }

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generateur_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleCsv() {
    const blob = await fetchCsv()
    if (!blob) return
    download(blob)
    setOpen(false)
    toast('CSV téléchargé', 'success')
  }

  async function handleSheet() {
    const blob = await fetchCsv()
    if (!blob) return
    download(blob)
    setOpen(false)
    window.open('https://sheets.new', '_blank', 'noopener')
    toast('CSV téléchargé — dans Google Sheets : Fichier → Importer', 'success')
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((o) => !o)} disabled={loading}>
        {loading ? 'Export…' : 'Exporter'}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-200 bg-white shadow-md p-2 z-20">
          <p className="px-2 pt-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Trier par</p>
          <div className="flex gap-1 px-1 pb-2">
            {(['date', 'views'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`flex-1 text-xs rounded-lg px-2 py-1.5 font-medium transition-colors ${
                  sort === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'date' ? 'Date' : 'Vues'}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-2 space-y-1">
            <button
              onClick={handleCsv}
              disabled={loading}
              className="w-full text-left text-sm px-2 py-2 rounded-lg text-gray-700 hover:bg-primary-soft hover:text-primary disabled:opacity-50"
            >
              Télécharger CSV
            </button>
            <button
              onClick={handleSheet}
              disabled={loading}
              className="w-full text-left text-sm px-2 py-2 rounded-lg text-gray-700 hover:bg-primary-soft hover:text-primary disabled:opacity-50"
            >
              Créer Google Sheet
            </button>
          </div>
          <p className="px-2 pt-2 text-[10px] text-gray-400 leading-snug">
            Inclut tous les posts (même sans script). UTF-8, prêt pour Claude.
          </p>
        </div>
      )}
    </div>
  )
}
