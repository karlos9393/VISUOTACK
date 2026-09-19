export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskView =
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'inbox'
  | 'all'
  | 'someday'
  | 'completed'
  | 'trash'
export type TaskLayout = 'list' | 'kanban' | 'matrix'
export type TaskSort =
  | 'manual'
  | 'priority'
  | 'due'
  | 'created'
  | 'alphabetical'
export interface TaskLabel {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}
export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  status: TaskStatus
  priority: number
  due_date: string | null
  due_time: string | null
  project_id: string | null
  parent_task_id: string | null
  position: number
  someday: boolean
  is_urgent: boolean
  is_important: boolean
  recurrence_frequency: 'none' | 'daily' | 'weekly' | 'monthly'
  recurrence_interval: number
  recurrence_weekdays: number[]
  recurrence_until: string | null
  recurrence_month_day: number | null
  generated_from_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  deleted_at: string | null
  tag_ids: string[]
}
export type TaskPatch = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'due_date'
    | 'due_time'
    | 'project_id'
    | 'parent_task_id'
    | 'position'
    | 'someday'
    | 'is_urgent'
    | 'is_important'
    | 'recurrence_frequency'
    | 'recurrence_interval'
    | 'recurrence_weekdays'
    | 'recurrence_until'
    | 'deleted_at'
  >
> & { tag_ids?: string[] }
export interface TaskData {
  tasks: Task[]
  projects: TaskLabel[]
  tags: TaskLabel[]
}
export interface Filters {
  search: string
  project: string
  tag: string
  priority: string
  status: string
  due: string
  sort: TaskSort
}
export const emptyFilters: Filters = {
  search: '',
  project: '',
  tag: '',
  priority: '',
  status: '',
  due: '',
  sort: 'manual'
}
export const priorities = ['Aucune', 'Faible', 'Moyenne', 'Haute', 'Urgente']
export const statuses: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé'
}
export const views: {
  id: TaskView
  label: string
  icon: string
  description: string
}[] = [
  {
    id: 'today',
    label: 'Aujourd’hui',
    icon: 'sun',
    description: 'Une chose à la fois. Faites place à l’essentiel.'
  },
  {
    id: 'upcoming',
    label: 'À venir',
    icon: 'calendar',
    description: 'Prenez une longueur d’avance sur les prochains jours.'
  },
  {
    id: 'overdue',
    label: 'En retard',
    icon: 'clock',
    description: 'Reprenez le fil, à votre rythme.'
  },
  {
    id: 'inbox',
    label: 'Boîte de réception',
    icon: 'inbox',
    description: 'Capturez vos idées. Organisez-les quand vous êtes prêt.'
  },
  {
    id: 'all',
    label: 'Toutes les tâches',
    icon: 'list',
    description: 'Tout votre travail, au même endroit.'
  },
  {
    id: 'someday',
    label: 'Un jour',
    icon: 'spark',
    description: 'Les bonnes idées méritent aussi leur place.'
  },
  {
    id: 'completed',
    label: 'Terminées',
    icon: 'check',
    description: 'Prenez un instant pour apprécier le chemin parcouru.'
  },
  {
    id: 'trash',
    label: 'Corbeille',
    icon: 'trash',
    description: 'Restaurez une tâche supprimée à tout moment.'
  }
]
