'use client'
import { useId } from 'react'
import { dateOffset, localDate } from '@/lib/tasks/query'
import type { TaskLabel, TaskPatch, Task } from '@/lib/tasks/types'
import { priorities } from '@/lib/tasks/types'
export const fieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50'
export function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {children}
    </div>
  )
}
export function ProjectSelector({
  value,
  projects,
  onChange
}: {
  value: string | null
  projects: TaskLabel[]
  onChange: (id: string | null) => void
}) {
  return (
    <Field label="Projet">
      <select
        aria-label="Projet"
        className={fieldClass}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Aucun projet</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </Field>
  )
}
export function PrioritySelector({
  value,
  onChange
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Field label="Priorité">
      <select
        aria-label="Priorité"
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {priorities.map((label, value) => (
          <option key={label} value={value}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  )
}
export function TagSelector({
  value,
  tags,
  onChange
}: {
  value: string[]
  tags: TaskLabel[]
  onChange: (ids: string[]) => void
}) {
  return (
    <Field label="Tags">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
          >
            <input
              type="checkbox"
              checked={value.includes(tag.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, tag.id]
                    : value.filter((id) => id !== tag.id)
                )
              }
              className="accent-primary"
            />
            <span style={{ color: tag.color }}>#</span>
            {tag.name}
          </label>
        ))}
        {!tags.length && (
          <p className="text-xs text-gray-400">
            Créez vos tags depuis « Gérer les tags ».
          </p>
        )}
      </div>
    </Field>
  )
}
export function DueDatePicker({
  task,
  onChange
}: {
  task: Task
  onChange: (patch: TaskPatch) => void
}) {
  const id = useId()
  const choose = (date: string | null) =>
    onChange({
      due_date: date,
      due_time: date ? task.due_time : null,
      someday: date ? false : task.someday,
      ...(!date ? { recurrence_frequency: 'none', recurrence_until: null } : {})
    })
  const day = (new Date().getDay() + 6) % 7
  return (
    <Field label="Échéance">
      <div className="flex flex-wrap gap-1.5">
        {[
          ['Aujourd’hui', localDate()],
          ['Demain', dateOffset(1)],
          ['Cette semaine', dateOffset(6 - day)],
          ['Semaine prochaine', dateOffset(7 - day)],
          ['Aucune date', '']
        ].map(([label, date]) => (
          <button
            key={label}
            type="button"
            onClick={() => choose(date || null)}
            className="rounded-md bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500 hover:bg-primary-soft hover:text-primary"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor={id} className="space-y-1 text-[11px] text-gray-400">
          <span>Choisir une date</span>
          <input
            id={id}
            aria-label="Date d’échéance"
            type="date"
            className={fieldClass}
            value={task.due_date || ''}
            onChange={(e) => choose(e.target.value || null)}
          />
        </label>
        <label className="space-y-1 text-[11px] text-gray-400">
          <span>Heure facultative</span>
          <input
            aria-label="Heure d’échéance"
            type="time"
            disabled={!task.due_date}
            className={fieldClass}
            value={task.due_time?.slice(0, 5) || ''}
            onChange={(e) => onChange({ due_time: e.target.value || null })}
          />
        </label>
      </div>
    </Field>
  )
}
export function RecurrencePicker({
  task,
  onChange
}: {
  task: Task
  onChange: (patch: TaskPatch) => void
}) {
  return (
    <Field label="Récurrence">
      <select
        aria-label="Récurrence"
        className={fieldClass}
        value={task.recurrence_frequency}
        onChange={(e) =>
          onChange({
            recurrence_frequency: e.target
              .value as Task['recurrence_frequency'],
            ...(e.target.value !== 'none' && !task.due_date
              ? { due_date: localDate(), someday: false }
              : {})
          })
        }
      >
        <option value="none">Aucune</option>
        <option value="daily">Tous les jours</option>
        <option value="weekly">Toutes les semaines / jours spécifiques</option>
        <option value="monthly">Tous les mois</option>
      </select>
      {task.recurrence_frequency !== 'none' && (
        <div className="space-y-3 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <label htmlFor="recurrence-interval">Tous les</label>
            <input
              id="recurrence-interval"
              aria-label="Intervalle personnalisé"
              type="number"
              required
              min={1}
              max={365}
              value={task.recurrence_interval}
              onChange={(e) =>
                onChange({ recurrence_interval: Number(e.target.value) })
              }
              className="w-16 rounded-lg border border-gray-200 px-2 py-1.5"
            />
            <span>
              {task.recurrence_frequency === 'daily'
                ? 'jour(s)'
                : task.recurrence_frequency === 'weekly'
                  ? 'semaine(s)'
                  : 'mois'}
            </span>
          </div>
          {task.recurrence_frequency === 'weekly' && (
            <div className="flex flex-wrap gap-1">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(
                (day, index) => (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={task.recurrence_weekdays.includes(index + 1)}
                    onClick={() =>
                      onChange({
                        recurrence_weekdays: task.recurrence_weekdays.includes(
                          index + 1
                        )
                          ? task.recurrence_weekdays.filter(
                              (d) => d !== index + 1
                            )
                          : [...task.recurrence_weekdays, index + 1].sort()
                      })
                    }
                    className={`rounded-lg px-2 py-2 text-xs ${task.recurrence_weekdays.includes(index + 1) ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          )}
          <label className="block space-y-1 text-xs text-gray-500">
            <span>Date de fin facultative</span>
            <input
              aria-label="Fin de récurrence"
              type="date"
              min={task.due_date || undefined}
              value={task.recurrence_until || ''}
              onChange={(e) =>
                onChange({ recurrence_until: e.target.value || null })
              }
              className={fieldClass}
            />
          </label>
          <p className="text-[11px] leading-5 text-gray-400">
            La prochaine occurrence est créée à la complétion, à partir de
            l’échéance prévue. Les occurrences terminées sont conservées.
          </p>
        </div>
      )}
    </Field>
  )
}
