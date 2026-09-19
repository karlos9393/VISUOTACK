'use client'
import { TaskItem, type TaskItemProps } from './task-item'
import type { Task } from '@/lib/tasks/types'
export function TaskList({
  tasks,
  manual,
  onReorder,
  ...props
}: Omit<TaskItemProps, 'task' | 'onMove'> & {
  tasks: Task[]
  manual: boolean
  onReorder: (ids: string[]) => void
}) {
  function move(id: string, target: string) {
    if (!manual || id === target) return
    const ids = tasks.map((task) => task.id),
      from = ids.indexOf(id),
      to = ids.indexOf(target)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, id)
    onReorder(ids)
  }
  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          onDragOver={(event) => {
            if (manual) event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()
            move(event.dataTransfer.getData('text/task-id'), task.id)
          }}
        >
          <TaskItem
            {...props}
            task={task}
            draggable={manual}
            onMove={
              manual
                ? (direction) => {
                    const target = tasks[index + direction]
                    if (target) move(task.id, target.id)
                  }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  )
}
