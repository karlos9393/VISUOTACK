import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminActions } from '@/components/admin-actions'
import Link from 'next/link'

const PAGE_SIZE = 20

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await searchParams
  const supabase = await createClient()
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: users, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: true })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion utilisateurs</h1>

      <Card>
        <CardTitle>Utilisateurs ({count || 0})</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Nom</th>
                <th className="pb-3 px-2 font-medium">Email</th>
                <th className="pb-3 px-2 font-medium">R\u00f4le</th>
                <th className="pb-3 px-2 font-medium">Cr\u00e9\u00e9 le</th>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
            {page > 1 && (
              <Link
                href={`/admin?page=${page - 1}`}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Pr\u00e9c\u00e9dent
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/admin?page=${page + 1}`}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Suivant
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
