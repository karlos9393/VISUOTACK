import { createClient } from '@/lib/supabase/server'
import { SetterLogForm } from '@/components/pipeline/setter-log-form'

export default async function SetterLogPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const { data: existingLog } = await supabase
    .from('setter_logs')
    .select('*')
    .eq('user_id', user!.id)
    .eq('date', today)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Log du jour</h1>
        <p className="text-gray-500 mt-1">
          Remplis tes chiffres pour aujourd&apos;hui — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <SetterLogForm existingLog={existingLog} />
    </div>
  )
}
