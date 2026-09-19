'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import {
  emptyFilters,
  views,
  type Task,
  type TaskData,
  type TaskLayout,
  type TaskView
} from '@/lib/tasks/types'
import {
  dateOffset,
  filterTasks,
  inView,
  isOverdue,
  localDate
} from '@/lib/tasks/query'
import { TaskSidebar } from './task-sidebar'
import { TaskFilters } from './task-filters'
import { QuickAddTask } from './quick-add-task'
import { TaskList } from './task-list'
import { TaskBoards } from './task-boards'
import { TaskDetails } from './task-details'
import { LabelManager } from './label-manager'
import { TaskDialog } from './task-dialog'
import { TaskIcon } from './task-icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
export function TaskPage({ initialData }: { initialData: TaskData }) {
  const controller = useTasks(initialData)
  const { data, pending } = controller
  const [view, setView] = useState<TaskView>('today')
  const [layout, setLayout] = useState<TaskLayout>('list')
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [manage, setManage] = useState<'project' | 'tag' | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [undoId, setUndoId] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        document.querySelector('dialog[open]') ||
        (event.target instanceof HTMLElement &&
          (event.target.closest('input,textarea,select') ||
            event.target.isContentEditable))
      )
        return
      if (event.key === 'n' || event.key === '/') {
        event.preventDefault()
        document
          .getElementById(event.key === 'n' ? 'task-quick-add' : 'task-search')
          ?.focus()
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])
  const tasks = useMemo(
    () => (now ? filterTasks(data.tasks, view, filters, now) : []),
    [data.tasks, view, filters, now]
  )
  const selected = useMemo(
    () => data.tasks.find((task) => task.id === selectedId),
    [data.tasks, selectedId]
  )
  const currentView = views.find((item) => item.id === view)!
  const project = data.projects.find(
    (project) => project.id === filters.project
  )
  const rootTasks = useMemo(
    () => data.tasks.filter((task) => !task.parent_task_id && !task.deleted_at),
    [data.tasks]
  )
  const stats = useMemo(() => {
    if (!now) return { today: 0, completedToday: 0, overdue: 0 }
    const todayStr = localDate(now)
    let today = 0,
      completedToday = 0,
      overdue = 0
    for (const task of rootTasks) {
      if (inView(task, 'today', now)) today++
      if (
        task.completed_at &&
        localDate(new Date(task.completed_at)) === todayStr
      )
        completedToday++
      if (isOverdue(task, now)) overdue++
    }
    return { today, completedToday, overdue }
  }, [rootTasks, now])
  const switchView = useCallback((next: TaskView) => {
    setView(next)
    setFilters(emptyFilters)
  }, [])
  const onOpen = useCallback((task: Task) => setSelectedId(task.id), [])
  const common = {
    data,
    pending,
    now: now || new Date(0),
    onOpen,
    onUpdate: controller.update,
    onDelete: setDeleting
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.17em] text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Votre quotidien, en clair
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tâches
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Moins de bruit. Plus de choses accomplies.
          </p>
        </div>
        <Button
          onClick={() => document.getElementById('task-quick-add')?.focus()}
          className="gap-2"
          disabled={pending}
        >
          <TaskIcon name="plus" />
          Nouvelle tâche
        </Button>
      </header>
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400"
        aria-live="polite"
      >
        <span>
          <strong className="font-semibold text-gray-700">
            {now ? stats.today : '—'}
          </strong>{' '}
          tâches aujourd&apos;hui
        </span>
        <span>
          <strong className="font-semibold text-gray-700">
            {now ? stats.completedToday : '—'}
          </strong>{' '}
          terminées aujourd&apos;hui
        </span>
        <span className={stats.overdue > 0 ? 'text-red-500' : ''}>
          <strong className="font-semibold">
            {now ? stats.overdue : '—'}
          </strong>{' '}
          en retard
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              pending ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'
            )}
          />
          {pending ? 'Enregistrement…' : 'Espace personnel'}
        </span>
      </div>
      {controller.error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
        >
          <span>{controller.error}</span>
          <button
            onClick={() => void controller.refresh()}
            className="shrink-0 underline"
          >
            Actualiser
          </button>
        </div>
      )}
      <div className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:flex-row">
        <TaskSidebar
          data={data}
          view={view}
          now={now || new Date(0)}
          project={filters.project}
          onView={switchView}
          onProject={(id) => {
            setView('all')
            setFilters({ ...emptyFilters, project: id })
          }}
          onManage={setManage}
        />
        <section className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {project?.name || currentView.label}
                <span className="ml-2 align-middle text-xs font-normal text-gray-400">
                  {tasks.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                {currentView.description}
              </p>
            </div>
            <div
              aria-label="Affichage"
              className="flex gap-0.5 rounded-lg bg-gray-100 p-1"
            >
              {(
                [
                  { id: 'list', label: 'Liste', icon: 'list' },
                  { id: 'kanban', label: 'Kanban', icon: 'board' },
                  { id: 'matrix', label: 'Matrice', icon: 'matrix' }
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLayout(item.id)}
                  aria-pressed={layout === item.id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition-colors',
                    layout === item.id
                      ? 'bg-white font-medium text-gray-800 shadow-sm'
                      : 'text-gray-400'
                  )}
                >
                  <TaskIcon name={item.icon} className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <TaskFilters data={data} value={filters} onChange={setFilters} />
          <div className="my-5">
            <QuickAddTask
              disabled={pending || !now}
              onAdd={async (title) => {
                const result = await controller.create({
                  title,
                  project_id: filters.project || null,
                  ...(filters.tag ? { tag_ids: [filters.tag] } : {}),
                  ...(filters.priority
                    ? { priority: Number(filters.priority) }
                    : {}),
                  ...(view === 'today'
                    ? { due_date: localDate() }
                    : view === 'upcoming'
                      ? { due_date: dateOffset(1) }
                      : view === 'someday'
                        ? { someday: true }
                        : {})
                })
                if (result && ['completed', 'trash', 'overdue'].includes(view))
                  switchView('all')
                return !!result
              }}
            />
          </div>
          {!now ? (
            <p
              className="py-16 text-center text-sm text-gray-400"
              role="status"
            >
              Chargement de votre espace…
            </p>
          ) : tasks.length ? (
            layout === 'list' ? (
              <TaskList
                {...common}
                tasks={tasks}
                manual={filters.sort === 'manual' && view !== 'trash'}
                onReorder={(ids) => void controller.reorder(ids)}
              />
            ) : (
              <TaskBoards
                {...common}
                tasks={tasks}
                matrix={layout === 'matrix'}
              />
            )
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft/70 text-primary">
                <TaskIcon name={currentView.icon} className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">
                {Object.entries(filters).some(
                  ([key, value]) => key !== 'sort' && !!value
                )
                  ? 'Aucune tâche ne correspond'
                  : view === 'today'
                    ? 'Une journée pleine de possibilités'
                    : view === 'completed'
                      ? 'Vos prochaines petites victoires'
                      : view === 'overdue'
                        ? 'Vous êtes à jour'
                        : 'Un peu d’espace pour vos idées'}
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-5 text-gray-400">
                {view === 'completed'
                  ? 'Les tâches cochées se retrouveront ici.'
                  : 'Ajoutez une tâche ou explorez une autre vue.'}
              </p>
              <button
                onClick={() =>
                  document.getElementById('task-quick-add')?.focus()
                }
                className="mt-5 text-xs font-medium text-primary"
              >
                + Ajouter une tâche
              </button>
            </div>
          )}
          <p className="mt-8 border-t border-gray-50 pt-4 text-[10px] text-gray-400">
            Raccourcis : N pour ajouter · / pour rechercher · Échap pour fermer
            {layout !== 'list' &&
              ' · Modifiez aussi les cartes depuis leur panneau de détail.'}
          </p>
        </section>
      </div>
      {selected && (
        <TaskDetails
          key={selected.id}
          task={selected}
          controller={controller}
          onClose={() => setSelectedId(null)}
          onDelete={setDeleting}
        />
      )}
      {manage && (
        <LabelManager
          kind={manage}
          controller={controller}
          onClose={() => setManage(null)}
        />
      )}
      {deleting && (
        <TaskDialog
          title="Supprimer la tâche ?"
          onClose={() => {
            if (!pending) setDeleting(null)
          }}
        >
          <p className="text-sm leading-6 text-gray-500">
            « {deleting.title} » et ses sous-tâches seront placées dans la
            corbeille. Vous pourrez les restaurer.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setDeleting(null)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={async () => {
                if (
                  await controller.update(deleting.id, {
                    deleted_at: new Date().toISOString()
                  })
                ) {
                  setUndoId(deleting.id)
                  setDeleting(null)
                  setSelectedId(null)
                }
              }}
            >
              Supprimer
            </Button>
          </div>
        </TaskDialog>
      )}
      {undoId && (
        <div
          role="status"
          className="fixed bottom-5 left-4 right-4 z-40 flex items-center justify-between gap-4 rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-lg sm:left-auto sm:w-96"
        >
          <span>Tâche placée dans la corbeille.</span>
          <button
            disabled={pending}
            className="font-medium text-coral-200"
            onClick={async () => {
              if (await controller.update(undoId, { deleted_at: null }))
                setUndoId(null)
            }}
          >
            Annuler
          </button>
          <button
            aria-label="Masquer la notification"
            onClick={() => setUndoId(null)}
          >
            <TaskIcon name="close" />
          </button>
        </div>
      )}
    </div>
  )
}
