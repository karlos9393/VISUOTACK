import { CrmSettingForm } from '@/components/crm-tracker/CrmSettingForm'

export const dynamic = 'force-dynamic'

export default function CrmSettingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setting CRM du jour</h1>
        <p className="text-gray-500 mt-1">
          Remplis tes stats de prospection du jour
        </p>
      </div>
      <CrmSettingForm />
    </div>
  )
}
