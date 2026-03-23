import { SetterSessionForm } from '@/components/pipeline/setter-session-form'

export default function SetterSessionPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setting du jour</h1>
        <p className="text-gray-500 mt-1">
          Remplis tes chiffres de la journée
        </p>
      </div>
      <SetterSessionForm />
    </div>
  )
}
