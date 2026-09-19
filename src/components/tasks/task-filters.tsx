'use client'
import type { Filters, TaskData, TaskSort } from '@/lib/tasks/types'
import { priorities, statuses } from '@/lib/tasks/types'
import { TaskIcon } from './task-icon'
export function TaskFilters({
  value,
  data,
  onChange
}: {
  value: Filters
  data: TaskData
  onChange: (value: Filters) => void
}) {
  const field = (name: keyof Filters, next: string) =>
    onChange({ ...value, [name]: next })
  const selectClass =
    'max-w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-600 focus:outline-primary'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-40 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-400">
          <TaskIcon name="search" />
          <input
            id="task-search"
            aria-label="Rechercher les tâches"
            placeholder="Rechercher une tâche…"
            value={value.search}
            onChange={(event) => field('search', event.target.value)}
            className="w-full min-w-0 text-sm text-gray-700 outline-none"
          />
          <kbd className="text-[10px]">/</kbd>
        </label>
        <select
          aria-label="Trier les tâches"
          className={selectClass}
          value={value.sort}
          onChange={(event) => field('sort', event.target.value as TaskSort)}
        >
          <option value="manual">Ordre manuel</option>
          <option value="priority">Priorité</option>
          <option value="due">Échéance</option>
          <option value="created">Date de création</option>
          <option value="alphabetical">Alphabétique</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Filtrer par projet"
          className={selectClass}
          value={value.project}
          onChange={(event) => field('project', event.target.value)}
        >
          <option value="">Tous les projets</option>
          {data.projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par tag"
          className={selectClass}
          value={value.tag}
          onChange={(event) => field('tag', event.target.value)}
        >
          <option value="">Tous les tags</option>
          {data.tags.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par priorité"
          className={selectClass}
          value={value.priority}
          onChange={(event) => field('priority', event.target.value)}
        >
          <option value="">Toutes les priorités</option>
          {priorities.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par statut"
          className={selectClass}
          value={value.status}
          onChange={(event) => field('status', event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statuses).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par échéance"
          className={selectClass}
          value={value.due}
          onChange={(event) => field('due', event.target.value)}
        >
          <option value="">Toutes les échéances</option>
          <option value="today">Aujourd’hui</option>
          <option value="upcoming">À venir</option>
          <option value="overdue">En retard</option>
          <option value="none">Aucune date</option>
        </select>
        {Object.entries(value).some(([key, val]) => key !== 'sort' && val) && (
          <button
            className="px-2 text-xs text-primary"
            onClick={() =>
              onChange({
                search: '',
                project: '',
                tag: '',
                priority: '',
                status: '',
                due: '',
                sort: value.sort
              })
            }
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  )
}
