'use client'

interface UserInitialsProps {
  fullName: string | null
  email: string
  updatedAt: string
}

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return fullName.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function UserInitials({ fullName, email, updatedAt }: UserInitialsProps) {
  const initials = getInitials(fullName, email)
  const displayName = fullName || email
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt))

  return (
    <td className="px-2 py-2 text-center">
      <div className="relative inline-flex group">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold cursor-default select-none">
          {initials}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
                        bg-gray-900 text-white text-xs rounded-lg shadow-lg
                        whitespace-nowrap z-50
                        hidden group-hover:flex flex-col">
          <span className="font-medium">{displayName}</span>
          <span className="text-gray-400 mt-0.5">Enregistr&eacute; le {formattedDate}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </td>
  )
}
