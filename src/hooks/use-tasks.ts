'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteTaskLabel,
  loadTasks,
  reorderTasks,
  saveTask,
  saveTaskLabel
} from '@/lib/actions/tasks'
import type { TaskData, TaskPatch } from '@/lib/tasks/types'
import { useToast } from '@/components/ui/toast'

export function useTasks(initial: TaskData) {
  const [data, setData] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inflight = useRef(0)
  const current = useRef(data)
  current.current = data
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { toast } = useToast()
  const refresh = useCallback(async () => {
    try {
      const result = await loadTasks()
      if (result.data) {
        setData(result.data)
        setError('')
      }
    } catch {
      // Background refresh failure is not critical
    }
  }, [])
  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => {
      if (inflight.current > 0) scheduleRefresh()
      else void refresh()
    }, 400)
  }, [refresh])
  useEffect(() => {
    const focus = () => void refresh()
    window.addEventListener('focus', focus)
    return () => {
      window.removeEventListener('focus', focus)
      clearTimeout(refreshTimer.current)
    }
  }, [refresh])
  async function mutate(
    action: () => Promise<{ error?: string; id?: string }>,
    optimistic?: (data: TaskData) => TaskData
  ) {
    inflight.current += 1
    setPending(true)
    setError('')
    if (optimistic) setData((prev) => optimistic(prev))
    try {
      const result = await action()
      if (result.error) throw new Error(result.error)
      scheduleRefresh()
      return result
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Connexion interrompue. Réessayez.'
      setError(message)
      toast(message, 'error')
      void refresh()
      return null
    } finally {
      inflight.current -= 1
      if (inflight.current === 0) setPending(false)
    }
  }
  async function update(id: string, patch: TaskPatch, expected?: string) {
    const existing = current.current.tasks.find((task) => task.id === id)
    return mutate(
      () => saveTask(id, patch, expected ?? existing?.updated_at),
      (before) => ({
        ...before,
        tasks: before.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...patch,
                ...(patch.status
                  ? {
                      completed_at:
                        patch.status === 'done'
                          ? new Date().toISOString()
                          : null
                    }
                  : {})
              }
            : task
        )
      })
    )
  }
  async function create(patch: TaskPatch) {
    return mutate(() =>
      saveTask(null, {
        position:
          Math.max(0, ...current.current.tasks.map((task) => task.position)) +
          1024,
        ...patch
      })
    )
  }
  async function reorder(ids: string[]) {
    return mutate(
      () => reorderTasks(ids),
      (before) => ({
        ...before,
        tasks: before.tasks.map((task) =>
          ids.includes(task.id)
            ? { ...task, position: (ids.indexOf(task.id) + 1) * 1024 }
            : task
        )
      })
    )
  }
  return {
    data,
    pending,
    error,
    refresh,
    update,
    create,
    reorder,
    saveLabel: (
      kind: 'project' | 'tag',
      id: string | null,
      value: { name: string; color: string }
    ) => mutate(() => saveTaskLabel(kind, id, value)),
    deleteLabel: (kind: 'project' | 'tag', id: string) =>
      mutate(() => deleteTaskLabel(kind, id))
  }
}
export type TasksController = ReturnType<typeof useTasks>
