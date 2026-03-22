'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { updateUserRole } from '@/lib/actions/admin'

interface AdminActionsProps {
  userId: string
  currentRole: string
}

export function AdminActions({ userId, currentRole }: AdminActionsProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    if (newRole === currentRole) return

    setLoading(true)
    const result = await updateUserRole(userId, newRole)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Rôle mis à jour', 'success')
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleRoleChange}
      disabled={loading}
      className="text-xs border rounded px-2 py-1 bg-white"
    >
      <option value="admin">Admin</option>
      <option value="manager">Manager</option>
      <option value="setter">Setter</option>
    </select>
  )
}
