'use client'
import { useState } from 'react'
import type { Task, TaskPatch } from '@/lib/tasks/types'
import { statuses } from '@/lib/tasks/types'
import type { TasksController } from '@/hooks/use-tasks'
import { TaskDialog } from './task-dialog'
import {
  DueDatePicker,
  Field,
  fieldClass,
  PrioritySelector,
  ProjectSelector,
  RecurrencePicker,
  TagSelector
} from './task-fields'
import { SubtaskList } from './subtask-list'
import { Button } from '@/components/ui/button'
export function TaskDetails({
  task,
  controller,
  onClose,
  onDelete
}: {
  task: Task
  controller: TasksController
  onClose: () => void
  onDelete: (task: Task) => void
}) {
  const [draft, setDraft] = useState(task)
  const [version] = useState(task.updated_at)
  const [dirty, setDirty] = useState(false)
  const [discard, setDiscard] = useState(false)
  const change = (patch: TaskPatch) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
  }
  const close = () => {
    if (controller.pending) return
    if (dirty) setDiscard(true)
    else onClose()
  }
  const stamp = (value: string) =>
    new Date(value).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const {
      title,
      description,
      status,
      priority,
      due_date,
      due_time,
      project_id,
      someday,
      is_urgent,
      is_important,
      recurrence_frequency,
      recurrence_interval,
      recurrence_weekdays,
      recurrence_until,
      tag_ids
    } = draft
    if (
      await controller.update(
        task.id,
        {
          title,
          description,
          status,
          priority,
          due_date,
          due_time,
          project_id,
          someday,
          is_urgent,
          is_important,
          recurrence_frequency,
          recurrence_interval,
          recurrence_weekdays,
          recurrence_until,
          tag_ids
        },
        version
      )
    )
      onClose()
  }
  return (
    <TaskDialog title="Détail de la tâche" onClose={close} drawer>
      <form onSubmit={submit} className="space-y-6">
        {discard && (
          <div
            role="alert"
            className="space-y-3 rounded-xl bg-amber-50 p-4 text-sm"
          >
            <p>Fermer sans enregistrer les modifications ?</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={onClose}>
                Abandonner
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setDiscard(false)}
              >
                Continuer l’édition
              </Button>
            </div>
          </div>
        )}
        {controller.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {controller.error}
          </p>
        )}
        <fieldset
          disabled={controller.pending || !!task.deleted_at}
          className="space-y-6 disabled:opacity-60"
        >
          <textarea
            aria-label="Titre"
            value={draft.title}
            maxLength={300}
            required
            rows={2}
            onChange={(e) => change({ title: e.target.value })}
            className="w-full resize-none border-0 text-2xl font-semibold leading-8 outline-none placeholder:text-gray-300"
            placeholder="Que souhaitez-vous accomplir ?"
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Statut">
              <select
                aria-label="Statut"
                value={draft.status}
                className={fieldClass}
                onChange={(e) =>
                  change({ status: e.target.value as Task['status'] })
                }
              >
                {Object.entries(statuses).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <PrioritySelector
              value={draft.priority}
              onChange={(priority) => change({ priority })}
            />
          </div>
          <Field label="Description">
            <textarea
              aria-label="Description"
              rows={4}
              maxLength={20000}
              value={draft.description}
              onChange={(e) => change({ description: e.target.value })}
              placeholder="Quelques précisions, un lien, une idée…"
              className={`${fieldClass} resize-y`}
            />
          </Field>
          <ProjectSelector
            projects={controller.data.projects}
            value={draft.project_id}
            onChange={(project_id) => change({ project_id })}
          />
          <TagSelector
            tags={controller.data.tags}
            value={draft.tag_ids}
            onChange={(tag_ids) => change({ tag_ids })}
          />
          <DueDatePicker task={draft} onChange={change} />
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              className="accent-primary"
              checked={draft.someday}
              onChange={(e) =>
                change({
                  someday: e.target.checked,
                  ...(e.target.checked
                    ? {
                        due_date: null,
                        due_time: null,
                        recurrence_frequency: 'none',
                        recurrence_until: null
                      }
                    : {})
                })
              }
            />
            Garder pour un jour
          </label>
          <RecurrencePicker task={draft} onChange={change} />
          <Field label="Matrice Eisenhower">
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  className="accent-primary"
                  type="checkbox"
                  checked={draft.is_urgent}
                  onChange={(e) => change({ is_urgent: e.target.checked })}
                />
                Urgent
              </label>
              <label className="flex items-center gap-2">
                <input
                  className="accent-primary"
                  type="checkbox"
                  checked={draft.is_important}
                  onChange={(e) => change({ is_important: e.target.checked })}
                />
                Important
              </label>
            </div>
          </Field>
          <div className="border-t border-gray-100 pt-5">
            <SubtaskList task={task} controller={controller} />
          </div>
        </fieldset>
        <div className="space-y-1 border-t border-gray-100 pt-4 text-[11px] text-gray-400">
          <p>Créée le {stamp(task.created_at)}</p>
          {task.completed_at && <p>Terminée le {stamp(task.completed_at)}</p>}
          {task.generated_from_id && <p>Occurrence d’une tâche récurrente</p>}
          <p>Les dates et heures sont affichées dans votre fuseau local.</p>
        </div>
        <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-white py-4">
          {task.deleted_at ? (
            <Button
              type="button"
              disabled={controller.pending}
              onClick={async () => {
                if (await controller.update(task.id, { deleted_at: null }))
                  onClose()
              }}
            >
              Restaurer la tâche
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={controller.pending}
                className="text-red-500"
                onClick={() => onDelete(task)}
              >
                Supprimer
              </Button>
              <Button
                type="submit"
                disabled={controller.pending || !draft.title.trim()}
              >
                {controller.pending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </>
          )}
        </footer>
      </form>
    </TaskDialog>
  )
}
