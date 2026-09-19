'use client'
import { useRef, useState } from 'react'
import { TaskIcon } from './task-icon'
export function QuickAddTask({
  onAdd,
  disabled
}: {
  onAdd: (title: string) => Promise<boolean>
  disabled: boolean
}) {
  const [title, setTitle] = useState('')
  const input = useRef<HTMLInputElement>(null)
  return (
    <form
      className="group flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-primary focus-within:bg-primary-soft/20"
      onSubmit={async (event) => {
        event.preventDefault()
        if (title.trim() && (await onAdd(title.trim()))) {
          setTitle('')
          requestAnimationFrame(() => input.current?.focus())
        }
      }}
    >
      <span className="text-primary">
        <TaskIcon name="plus" className="h-5 w-5" />
      </span>
      <input
        ref={input}
        id="task-quick-add"
        aria-label="Titre de la nouvelle tâche"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={300}
        placeholder="Ajouter une tâche, puis appuyer sur Entrée…"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || !title.trim()}
        className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500 disabled:opacity-40"
        aria-label="Ajouter la tâche"
      >
        ↵
      </button>
    </form>
  )
}
