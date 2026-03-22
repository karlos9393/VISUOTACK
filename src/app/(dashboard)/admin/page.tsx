import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminActions } from '@/components/admin-actions'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion utilisateurs</h1>

      <Card>
        <CardTitle>Utilisateurs ({users?.length || 0})</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Nom</th>
                <th className="pb-3 px-2 font-medium">Email</th>
                <th className="pb-3 px-2 font-medium">Rôle</th>
                <th className="pb-3 px-2 font-medium">Créé le</th>
                <th className="pb-3 pl-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {user.full_name || '-'}
                  </td>
                  <td className="py-3 px-2 text-gray-600">{user.email}</td>
                  <td className="py-3 px-2">
                    <Badge className={
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'manager'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 pl-2">
                    <AdminActions userId={user.id} currentRole={user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
