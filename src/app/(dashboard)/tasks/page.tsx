import { TaskPage } from '@/components/tasks/task-page'
import { loadTasks } from '@/lib/actions/tasks'
export const metadata = { title: 'Tâches · Visuo Track' }
export default async function TasksRoute() {
  const result = await loadTasks()
  if (!result.data)
    return (
      <div className="rounded-xl border border-red-100 bg-white p-8">
        <h1 className="text-xl font-semibold">
          Vos tâches ne sont pas disponibles
        </h1>
        <p className="mt-3 text-sm text-gray-500">{result.error}</p>
        <a
          href="/tasks"
          className="mt-5 inline-block text-sm font-medium text-primary"
        >
          Réessayer
        </a>
      </div>
    )
  return <TaskPage initialData={result.data} />
}
