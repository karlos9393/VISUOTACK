import type { Filters, Task, TaskView } from './types'

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function dateOffset(days: number, now = new Date()): string {
  const value = new Date(now)
  value.setDate(value.getDate() + days)
  return localDate(value)
}
export function isOverdue(task: Task, now = new Date()): boolean {
  if (task.status === 'done' || !task.due_date || task.deleted_at) return false
  const today = localDate(now)
  return (
    task.due_date < today ||
    (task.due_date === today &&
      !!task.due_time &&
      task.due_time.slice(0, 5) <
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
  )
}
export function inView(task: Task, view: TaskView, now = new Date()): boolean {
  if (task.parent_task_id) return false
  if (view === 'trash') return !!task.deleted_at
  if (task.deleted_at) return false
  if (view === 'completed') return task.status === 'done'
  if (view === 'all') return true
  if (task.status === 'done') return false
  const today = localDate(now)
  switch (view) {
    case 'today':
      return task.due_date === today
    case 'upcoming':
      return !!task.due_date && task.due_date > today
    case 'overdue':
      return isOverdue(task, now)
    case 'inbox':
      return !task.project_id && !task.due_date && !task.someday
    case 'someday':
      return task.someday
  }
}
export function filterTasks(
  tasks: Task[],
  view: TaskView,
  filters: Filters,
  now = new Date()
): Task[] {
  const needle = filters.search.trim().toLocaleLowerCase('fr')
  return tasks
    .filter(
      (task) =>
        inView(task, view, now) &&
        (!needle ||
          `${task.title} ${task.description}`
            .toLocaleLowerCase('fr')
            .includes(needle)) &&
        (!filters.project || task.project_id === filters.project) &&
        (!filters.tag || task.tag_ids.includes(filters.tag)) &&
        (filters.priority === '' ||
          task.priority === Number(filters.priority)) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.due ||
          (filters.due === 'none'
            ? !task.due_date
            : filters.due === 'overdue'
              ? isOverdue(task, now)
              : filters.due === 'today'
                ? task.due_date === localDate(now)
                : !!task.due_date && task.due_date > localDate(now)))
    )
    .sort((a, b) => {
      let comparison = 0
      switch (filters.sort) {
        case 'priority':
          comparison = b.priority - a.priority
          break
        case 'due':
          comparison =
            `${a.due_date || '9999'} ${a.due_time || '23:59'}`.localeCompare(
              `${b.due_date || '9999'} ${b.due_time || '23:59'}`
            )
          break
        case 'created':
          comparison = b.created_at.localeCompare(a.created_at)
          break
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title, 'fr')
          break
        default:
          comparison = a.position - b.position
      }
      return comparison || a.id.localeCompare(b.id)
    })
}
export function dueLabel(task: Task, now = new Date()): string {
  if (!task.due_date) return ''
  const label =
    task.due_date === localDate(now)
      ? 'Aujourd’hui'
      : task.due_date === dateOffset(1, now)
        ? 'Demain'
        : new Date(`${task.due_date}T12:00:00`).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
          })
  return label + (task.due_time ? ` · ${task.due_time.slice(0, 5)}` : '')
}
