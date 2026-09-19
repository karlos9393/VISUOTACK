'use client'
import { useMemo, useState } from 'react'
import type { Task, TaskData, TaskPatch } from '@/lib/tasks/types'
import { priorities } from '@/lib/tasks/types'
import { dueLabel, isOverdue } from '@/lib/tasks/query'
import { TaskIcon } from './task-icon'
import { cn } from '@/lib/utils'
export interface TaskItemProps {
  task: Task
  data: TaskData
  pending: boolean
  now: Date
  compact?: boolean
  draggable?: boolean
  onOpen: (task: Task) => void
  onUpdate: (id: string, patch: TaskPatch) => Promise<unknown>
  onDelete: (task: Task) => void
  onMove?: (direction: -1 | 1) => void
}
export function TaskItem({
  task,
  data,
  pending,
  now,
  compact,
  draggable,
  onOpen,
  onUpdate,
  onDelete,
  onMove
}: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const project = data.projects.find((item) => item.id === task.project_id)
  const children = useMemo(
    () =>
      data.tasks.filter(
        (item) => item.parent_task_id === task.id && !item.deleted_at
      ),
    [data.tasks, task.id]
  )
  const done = task.status === 'done'
  return (
    <article
      draggable={draggable && !pending && !editing}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/task-id', task.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'group relative flex gap-3 rounded-xl border border-gray-100 bg-white p-3.5 transition-all hover:border-gray-200 hover:shadow-sm',
        done && 'bg-gray-50/70',
        compact ? 'items-start' : 'items-center'
      )}
    >
      {draggable && !compact && (
        <span
          className="hidden cursor-grab text-gray-300 sm:block"
          aria-hidden="true"
        >
          <TaskIcon name="grip" />
        </span>
      )}
      <input
        type="checkbox"
        checked={done}
        disabled={pending || !!task.deleted_at}
        onChange={() =>
          void onUpdate(task.id, { status: done ? 'todo' : 'done' })
        }
        aria-label={`Terminer : ${task.title}`}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary transition-transform active:scale-90"
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (
                title.trim() &&
                (await onUpdate(task.id, { title: title.trim() }))
              )
                setEditing(false)
            }}
          >
            <input
              aria-label="Modifier le titre"
              autoFocus
              value={title}
              maxLength={300}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEditing(false)
              }}
              onBlur={() => setEditing(false)}
              className="w-full rounded border border-primary px-1 text-sm outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => onOpen(task)}
            onDoubleClick={() => {
              setTitle(task.title)
              setEditing(true)
            }}
            className={cn(
              'block w-full break-words text-left text-sm font-medium leading-5',
              done ? 'text-gray-400 line-through' : 'text-gray-800'
            )}
          >
            {task.title}
          </button>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          {project && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: project.color }}
              />
              {project.name}
            </span>
          )}
          {task.priority > 0 && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5',
                task.priority >= 3
                  ? 'bg-red-50 text-red-600'
                  : task.priority === 2
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
              )}
            >
              {priorities[task.priority]}
            </span>
          )}
          {task.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                isOverdue(task, now) ? 'text-red-500' : 'text-gray-500'
              )}
            >
              <TaskIcon name="calendar" className="h-3 w-3" />
              {dueLabel(task, now)}
            </span>
          )}
          {!!children.length && (
            <span aria-label="Progression des sous-tâches">
              {children.filter((child) => child.status === 'done').length} /{' '}
              {children.length}
            </span>
          )}
          {task.recurrence_frequency !== 'none' && (
            <span title="Tâche récurrente">
              <TaskIcon name="repeat" className="h-3 w-3" />
            </span>
          )}
          {task.tag_ids
            .map((id) => data.tags.find((tag) => tag.id === id))
            .filter(Boolean)
            .map((tag) => (
              <span key={tag!.id}>#{tag!.name}</span>
            ))}
        </div>
      </div>
      <details className="relative shrink-0">
        <summary
          aria-label={`Actions : ${task.title}`}
          className="cursor-pointer list-none rounded-lg p-1 text-gray-400 hover:bg-gray-50"
        >
          <TaskIcon name="more" />
        </summary>
        <div
          className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-gray-200 bg-white p-1.5 text-xs shadow-lg"
          onClick={(event) => {
            const details = event.currentTarget
              .parentElement as HTMLDetailsElement
            details.open = false
          }}
        >
          {task.deleted_at ? (
            <button
              disabled={pending}
              onClick={() => void onUpdate(task.id, { deleted_at: null })}
              className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
            >
              Restaurer
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpen(task)}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
              >
                Ouvrir les détails
              </button>
              <button
                onClick={() => {
                  setTitle(task.title)
                  setEditing(true)
                }}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
              >
                Modifier le titre
              </button>
              {onMove && (
                <>
                  <button
                    disabled={pending}
                    onClick={() => onMove(-1)}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    Monter ↑
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => onMove(1)}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                  >
                    Descendre ↓
                  </button>
                </>
              )}
              <button
                disabled={pending}
                onClick={() => onDelete(task)}
                className="w-full rounded-lg px-3 py-2 text-left text-red-500 hover:bg-red-50"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </details>
    </article>
  )
}
