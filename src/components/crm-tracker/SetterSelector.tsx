'use client'

interface SetterOption {
  id: string
  full_name: string | null
  email: string
}

interface SetterSelectorProps {
  setters: SetterOption[]
  selectedId: string
  onChange: (setterId: string) => void
}

export function SetterSelector({ setters, selectedId, onChange }: SetterSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Setter :</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {setters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name || s.email}
          </option>
        ))}
      </select>
    </div>
  )
}
