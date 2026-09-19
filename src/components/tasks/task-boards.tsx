'use client'
import { useState } from 'react'
import { TaskItem, type TaskItemProps } from './task-item'
import { statuses, type Task, type TaskPatch } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'
const quadrants = [
  {
    id: 'do',
    title: 'Faire',
    subtitle: 'Urgent + Important',
    urgent: true,
    important: true,
    color: 'border-red-200 bg-red-50/30'
  },
  {
    id: 'plan',
    title: 'Planifier',
    subtitle: 'Important + Non urgent',
    urgent: false,
    important: true,
    color: 'border-emerald-200 bg-emerald-50/30'
  },
  {
    id: 'delegate',
    title: 'Déléguer',
    subtitle: 'Urgent + Non important',
    urgent: true,
    important: false,
    color: 'border-amber-200 bg-amber-50/30'
  },
  {
    id: 'leave',
    title: 'Reconsidérer',
    subtitle: 'Ni urgent ni important',
    urgent: false,
    important: false,
    color: 'border-gray-200 bg-gray-50/70'
  }
]
export function TaskBoards({
  tasks,
  matrix,
  ...props
}: Omit<TaskItemProps, 'task'> & { tasks: Task[]; matrix: boolean }) {
  const [over, setOver] = useState('')
  const columns = matrix
    ? quadrants.map((q) => ({
        ...q,
        patch: { is_urgent: q.urgent, is_important: q.important } as TaskPatch,
        items: tasks.filter(
          (t) => t.is_urgent === q.urgent && t.is_important === q.important
        )
      }))
    : Object.entries(statuses).map(([id, title]) => ({
        id,
        title,
        subtitle: '',
        color: 'border-gray-100 bg-gray-50/70',
        patch: { status: id } as TaskPatch,
        items: tasks.filter((t) => t.status === id)
      }))
  return (
    <div
      className={cn('grid gap-3', matrix ? 'sm:grid-cols-2' : 'md:grid-cols-3')}
    >
      {columns.map((column) => (
        <section
          key={column.id}
          aria-label={column.subtitle || column.title}
          onDragOver={(event) => {
            event.preventDefault()
            setOver(column.id)
          }}
          onDragLeave={() => setOver('')}
          onDrop={(event) => {
            event.preventDefault()
            setOver('')
            const id = event.dataTransfer.getData('text/task-id')
            if (tasks.some((t) => t.id === id) && !props.pending)
              void props.onUpdate(id, column.patch)
          }}
          className={cn(
            'min-h-48 rounded-xl border p-3 transition-colors',
            column.color,
            over === column.id && 'ring-2 ring-primary/40'
          )}
        >
          <header className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-xs font-semibold">{column.title}</h3>
              {column.subtitle && (
                <p className="mt-1 text-[10px] text-gray-500">
                  {column.subtitle}
                </p>
              )}
            </div>
            <span className="rounded bg-white px-1.5 text-xs text-gray-400">
              {column.items.length}
            </span>
          </header>
          <div className="space-y-2">
            {column.items.map((task) => (
              <TaskItem
                key={task.id}
                {...props}
                task={task}
                compact
                draggable={!task.deleted_at}
              />
            ))}
          </div>
          {!column.items.length && (
            <p className="py-8 text-center text-[11px] text-gray-400">
              Glissez une tâche ici
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
