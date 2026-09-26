import { CrmSettingForm } from '@/components/crm-tracker/CrmSettingForm'
import { getCrmEntryForDate } from '@/lib/actions/crm-tracker'

export const dynamic = 'force-dynamic'

export default async function CrmSettingPage() {
  // Même calcul de date que le formulaire (UTC) : l'entrée du jour arrive avec la page
  const today = new Date().toISOString().split('T')[0]
  const entry = await getCrmEntryForDate(today)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setting CRM du jour</h1>
        <p className="text-gray-500 mt-1">
          Remplis tes stats de prospection du jour
        </p>
      </div>
      <CrmSettingForm initialDate={today} initialEntry={entry} />
    </div>
  )
}
