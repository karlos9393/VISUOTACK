'use client'
import { useState } from 'react'
import type { Task } from '@/lib/tasks/types'
import type { TasksController } from '@/hooks/use-tasks'
import { TaskIcon } from './task-icon'
export function SubtaskList({
  task,
  controller
}: {
  task: Task
  controller: TasksController
}) {
  const [title, setTitle] = useState('')
  const children = controller.data.tasks
    .filter((child) => child.parent_task_id === task.id && !child.deleted_at)
    .sort((a, b) => a.position - b.position)
  return (
    <section className="space-y-3">
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <h3>Sous-tâches</h3>
        <span>
          {children.filter((child) => child.status === 'done').length} /{' '}
          {children.length}
        </span>
      </div>
      {!!children.length && (
        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${(children.filter((child) => child.status === 'done').length / children.length) * 100}%`
            }}
          />
        </div>
      )}
      {children.map((child, index) => (
        <div key={child.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label={`Terminer la sous-tâche : ${child.title}`}
            className="h-4 w-4 accent-primary"
            checked={child.status === 'done'}
            disabled={controller.pending}
            onChange={() =>
              void controller.update(child.id, {
                status: child.status === 'done' ? 'todo' : 'done'
              })
            }
          />
          <input
            key={`${child.id}-${child.updated_at}`}
            aria-label="Titre de la sous-tâche"
            defaultValue={child.title}
            maxLength={300}
            disabled={controller.pending}
            onBlur={(event) => {
              if (
                event.target.value.trim() &&
                event.target.value !== child.title
              )
                void controller.update(child.id, {
                  title: event.target.value.trim()
                })
              else event.target.value = child.title
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
            className={`min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-sm hover:border-gray-200 focus:border-primary focus:outline-none ${child.status === 'done' ? 'text-gray-400 line-through' : ''}`}
          />
          <button
            type="button"
            disabled={controller.pending || !index}
            aria-label="Monter la sous-tâche"
            className="text-xs text-gray-400 disabled:opacity-20"
            onClick={() => {
              const ids = children.map((c) => c.id)
              ;[ids[index], ids[index - 1]] = [ids[index - 1], ids[index]]
              void controller.reorder(ids)
            }}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Supprimer la sous-tâche : ${child.title}`}
            disabled={controller.pending}
            onClick={async () => {
              await controller.update(child.id, {
                deleted_at: new Date().toISOString()
              })
            }}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <TaskIcon name="close" className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          aria-label="Nouvelle sous-tâche"
          value={title}
          maxLength={300}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (
                title.trim() &&
                (await controller.create({
                  title: title.trim(),
                  parent_task_id: task.id
                }))
              )
                setTitle('')
            }
          }}
          placeholder="Ajouter une sous-tâche…"
          className="min-w-0 flex-1 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          aria-label="Ajouter la sous-tâche"
          disabled={!title.trim() || controller.pending}
          onClick={async () => {
            if (
              await controller.create({
                title: title.trim(),
                parent_task_id: task.id
              })
            )
              setTitle('')
          }}
          className="rounded-lg px-2 text-primary disabled:opacity-40"
        >
          <TaskIcon name="plus" />
        </button>
      </div>
      {controller.data.tasks
        .filter((child) => child.parent_task_id === task.id && child.deleted_at)
        .map((child) => (
          <div
            key={child.id}
            className="flex items-center justify-between text-xs text-gray-400"
          >
            <span className="truncate">{child.title} · supprimée</span>
            <button
              type="button"
              disabled={controller.pending}
              onClick={() =>
                void controller.update(child.id, { deleted_at: null })
              }
              className="ml-3 text-primary"
            >
              Restaurer
            </button>
          </div>
        ))}
    </section>
  )
}
