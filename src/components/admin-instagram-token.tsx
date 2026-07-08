'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { updateInstagramToken } from '@/lib/actions/admin'

interface TokenStatus {
  valid: boolean
  neverExpires: boolean
  expiresAt: string | null
  daysRemaining: number | null
  type?: string
  error?: string
}

interface Props {
  initialStatus: TokenStatus
}

function StatusBadge({ status }: { status: TokenStatus }) {
  if (!status.valid) {
    return <Badge className="bg-red-100 text-red-700">Invalide / expiré</Badge>
  }
  if (status.neverExpires) {
    return <Badge className="bg-green-100 text-green-700">Permanent (n&apos;expire jamais)</Badge>
  }
  const d = status.daysRemaining ?? 0
  if (d <= 7) return <Badge className="bg-red-100 text-red-700">Expire dans {d} j</Badge>
  if (d <= 21) return <Badge className="bg-amber-100 text-amber-700">Expire dans {d} j</Badge>
  return <Badge className="bg-green-100 text-green-700">Valide — {d} j restants</Badge>
}

export function InstagramTokenCard({ initialStatus }: Props) {
  const [status, setStatus] = useState<TokenStatus>(initialStatus)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    if (!token.trim()) {
      toast('Colle un token avant d\'enregistrer', 'error')
      return
    }
    setLoading(true)
    const result = await updateInstagramToken(token)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Token Instagram mis à jour', 'success')
    setToken('')
    setStatus({
      valid: true,
      neverExpires: Boolean(result.neverExpires),
      expiresAt: result.expiresAt ?? null,
      daysRemaining: result.daysRemaining ?? null,
      type: result.type,
    })
  }

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <CardTitle>Token Instagram</CardTitle>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-gray-500">Statut</dt>
        <dd className="text-gray-900 font-medium">{status.valid ? 'Actif' : 'Inactif'}</dd>

        <dt className="text-gray-500">Type</dt>
        <dd className="text-gray-900 font-medium">{status.type || '—'}</dd>

        <dt className="text-gray-500">Expiration</dt>
        <dd className="text-gray-900 font-medium">
          {status.neverExpires
            ? 'Jamais'
            : status.expiresAt
              ? new Date(status.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'}
        </dd>

        <dt className="text-gray-500">Jours restants</dt>
        <dd className="text-gray-900 font-medium">
          {status.neverExpires ? '∞' : status.daysRemaining != null ? `${status.daysRemaining} j` : '—'}
        </dd>
      </dl>

      {status.error && !status.valid && (
        <p className="mt-3 text-xs text-red-600">Erreur Meta : {status.error}</p>
      )}

      {!status.neverExpires && status.valid && (status.daysRemaining ?? 99) <= 21 && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          Ce token va expirer. Remplace-le par un <strong>System User token permanent</strong> pour ne plus jamais avoir de coupure.
        </div>
      )}

      <div className="mt-5 border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Coller un nouveau token (System User / long-lived)
        </label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="EAAG..."
          rows={3}
          className="w-full text-xs font-mono border rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-400">
          Le token est validé auprès de Meta puis stocké côté serveur (table app_config, accès service_role uniquement). Aucun redéploiement nécessaire.
        </p>
        <div className="mt-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Validation…' : 'Enregistrer le token'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
