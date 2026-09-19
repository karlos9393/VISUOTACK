'use client'
import { useMemo } from 'react'
import type { TaskData, TaskView } from '@/lib/tasks/types'
import { views } from '@/lib/tasks/types'
import { inView } from '@/lib/tasks/query'
import { TaskIcon } from './task-icon'
import { cn } from '@/lib/utils'
export function TaskSidebar({
  data,
  view,
  project,
  now,
  onView,
  onProject,
  onManage
}: {
  data: TaskData
  view: TaskView
  project: string
  now: Date
  onView: (view: TaskView) => void
  onProject: (id: string) => void
  onManage: (kind: 'project' | 'tag') => void
}) {
  const viewCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of views) {
      counts[v.id] = data.tasks.filter((task) => inView(task, v.id, now)).length
    }
    return counts
  }, [data.tasks, now])
  return (
    <aside className="w-full shrink-0 border-b border-gray-100 p-4 xl:w-52 xl:border-b-0 xl:border-r">
      <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 xl:block">
        Mon espace
      </p>
      <nav
        aria-label="Vues des tâches"
        className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible"
      >
        {views.map((item) => (
          <button
            key={item.id}
            onClick={() => onView(item.id)}
            aria-current={view === item.id && !project ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors',
              view === item.id && !project
                ? 'bg-primary-soft text-primary'
                : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            <TaskIcon name={item.icon} />
            <span className="whitespace-nowrap">{item.label}</span>
            <span className="ml-auto pl-2 text-[11px] tabular-nums opacity-70">
              {viewCounts[item.id] ?? 0}
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-5 hidden border-t border-gray-100 pt-5 xl:block">
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Projets
          </h3>
          <button
            aria-label="Gérer les projets"
            onClick={() => onManage('project')}
            className="rounded p-1 hover:bg-gray-100"
          >
            <TaskIcon name="plus" />
          </button>
        </div>
        {data.projects.length === 0 && (
          <p className="px-3 text-xs leading-5 text-gray-400">
            Un projet pour chaque
            <br />
            grande idée.
          </p>
        )}
        {data.projects.map((item) => (
          <button
            key={item.id}
            onClick={() => onProject(item.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs',
              project === item.id
                ? 'bg-gray-100 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2 xl:mt-6 xl:flex-col">
        <button
          onClick={() => onManage('project')}
          className="rounded-lg px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 xl:hidden"
        >
          Gérer les projets
        </button>
        <button
          onClick={() => onManage('tag')}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50"
        >
          <TaskIcon name="tag" /> Gérer les tags
        </button>
      </div>
    </aside>
  )
}
