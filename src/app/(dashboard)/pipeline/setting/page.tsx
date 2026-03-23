import { SetterSessionForm } from '@/components/pipeline/setter-session-form'
import { SetterStats } from '@/components/pipeline/setter-stats'
import { getSetterStats } from '@/lib/actions/setter-logs'

export const dynamic = 'force-dynamic'

export default async function SetterSessionPage() {
  const stats = await getSetterStats()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setting du jour</h1>
        <p className="text-gray-500 mt-1">
          Remplis tes chiffres de la journ&eacute;e
        </p>
      </div>
      {stats && <SetterStats stats={stats} />}
      <SetterSessionForm />
    </div>
  )
}
