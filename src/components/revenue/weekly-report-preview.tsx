import { Card, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { WeeklyReport } from '@/lib/types'

interface WeeklyReportPreviewProps {
  report: WeeklyReport
}

export function WeeklyReportPreview({ report }: WeeklyReportPreviewProps) {
  return (
    <Card>
      <CardTitle>Dernier rapport — Semaine du {formatDate(report.week_start)}</CardTitle>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="font-medium text-gray-900 mb-2">Pipeline</p>
          <div className="space-y-1 text-gray-600">
            <p>Conversations : {report.total_conversations}</p>
            <p>Closes : {report.total_closes} (taux : {report.close_rate}%)</p>
            <p>Show rate : {report.show_rate}%</p>
          </div>
        </div>
        <div>
          <p className="font-medium text-gray-900 mb-2">Contenu</p>
          <div className="space-y-1 text-gray-600">
            <p>Posts publiés : {report.posts_published}</p>
            <p>Vues totales : {report.total_views?.toLocaleString('fr-FR')}</p>
            <p>Abonnés gagnés : {report.followers_gained}</p>
          </div>
        </div>
        <div>
          <p className="font-medium text-gray-900 mb-2">Revenue</p>
          <div className="space-y-1 text-gray-600">
            <p>CA total : {Number(report.ca_total).toLocaleString('fr-FR')}€</p>
            <p>Formation : {Number(report.ca_formation).toLocaleString('fr-FR')}€</p>
            <p>Accompagnement : {Number(report.ca_accompagnement).toLocaleString('fr-FR')}€</p>
            <p>DFY : {Number(report.ca_dfy).toLocaleString('fr-FR')}€</p>
          </div>
        </div>
      </div>
      {report.sent_at && (
        <p className="mt-4 text-xs text-gray-400">
          Envoyé le {formatDate(report.sent_at, 'dd/MM/yyyy HH:mm')}
        </p>
      )}
    </Card>
  )
}
