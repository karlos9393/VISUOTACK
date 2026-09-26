import { ComparerDashboard } from '@/components/contenu/comparer-dashboard'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function ComparerPage() {
  const user = await getSessionUser()
  if (!user) return null

  return <ComparerDashboard />
}
