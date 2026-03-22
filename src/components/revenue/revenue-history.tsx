import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { RevenueEntry } from '@/lib/types'

interface RevenueHistoryProps {
  entries: RevenueEntry[]
}

const offerLabels: Record<string, string> = {
  formation: 'Formation',
  accompagnement: 'Accompagnement',
  dfy: 'DFY',
}

const paymentLabels: Record<string, string> = {
  complet: 'Complet',
  acompte: 'Acompte',
  solde: 'Solde',
}

export function RevenueHistory({ entries }: RevenueHistoryProps) {
  return (
    <Card>
      <CardTitle>10 dernières ventes</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 px-2 font-medium">Client</th>
              <th className="pb-3 px-2 font-medium">Offre</th>
              <th className="pb-3 px-2 font-medium">Paiement</th>
              <th className="pb-3 px-2 font-medium text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b last:border-0">
                <td className="py-3 pr-4">{formatDate(entry.date)}</td>
                <td className="py-3 px-2 text-gray-900">{entry.client_name || '-'}</td>
                <td className="py-3 px-2">
                  <Badge className="bg-blue-100 text-blue-700">
                    {offerLabels[entry.offer] || entry.offer}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-gray-600">
                  {paymentLabels[entry.payment_type] || entry.payment_type}
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  {Number(entry.amount).toLocaleString('fr-FR')}€
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Aucune vente enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
