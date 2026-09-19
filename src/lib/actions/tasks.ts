'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { taskPatchSchema, labelSchema } from '@/lib/tasks/validation'
import type { Task, TaskData, TaskPatch } from '@/lib/tasks/types'

async function session() {
  const client = await createClient()
  const {
    data: { user }
  } = await client.auth.getUser()
  if (!user) throw new Error('Votre session a expiré. Reconnectez-vous.')
  return { client, user }
}
function failure(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message || '')
  if (/session|actualisez|changé|introuvable/i.test(message)) return message
  if (/unique|duplicate/i.test(message)) return 'Ce nom existe déjà.'
  return 'Impossible d’enregistrer. Vérifiez votre connexion puis réessayez.'
}
export async function loadTasks(): Promise<{
  data?: TaskData
  error?: string
}> {
  try {
    const { client, user } = await session()
    // Explicit pagination avoids Supabase's default 1000-row response cap.
    async function allRows(table: string) {
      const rows: Record<string, unknown>[] = []
      for (let start = 0; ; start += 1000) {
        const result = await client
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .order(table === 'task_tag_links' ? 'task_id' : 'id')
          .order(table === 'task_tag_links' ? 'tag_id' : 'id')
          .range(start, start + 999)
        if (result.error) throw result.error
        rows.push(...result.data)
        if (result.data.length < 1000) return rows
      }
    }
    const [tasks, projects, tags, links] = await Promise.all([
      allRows('tasks'),
      allRows('task_projects'),
      allRows('task_tags'),
      allRows('task_tag_links')
    ])
    const tagsByTask = new Map<string, string[]>()
    for (const link of links)
      tagsByTask.set(link.task_id as string, [
        ...(tagsByTask.get(link.task_id as string) || []),
        link.tag_id as string
      ])
    return {
      data: {
        tasks: tasks.map((task) => ({
          ...task,
          tag_ids: tagsByTask.get(task.id as string) || []
        })) as Task[],
        projects: projects as unknown as TaskData['projects'],
        tags: tags as unknown as TaskData['tags']
      }
    }
  } catch (error) {
    return { error: failure(error) }
  }
}
export async function saveTask(
  id: string | null,
  input: TaskPatch,
  expectedUpdatedAt?: string
): Promise<{ id?: string; error?: string }> {
  const parsed = taskPatchSchema.safeParse(input)
  if (!parsed.success)
    return {
      error: 'Vérifiez le titre, les dates et les paramètres de la tâche.'
    }
  if (id && !z.uuid().safeParse(id).success) return { error: 'Tâche invalide.' }
  if (!id && !parsed.data.title) return { error: 'Le titre est obligatoire.' }
  try {
    const { client } = await session()
    const { tag_ids, ...patch } = parsed.data
    const { data, error } = await client.rpc('save_task', {
      task_id: id,
      patch,
      tag_ids: tag_ids ?? null,
      expected_updated_at: expectedUpdatedAt ?? null
    })
    if (error) throw error
    return { id: data as string }
  } catch (error) {
    return { error: failure(error) }
  }
}
export async function reorderTasks(ids: string[]) {
  if (!z.array(z.uuid()).max(10000).safeParse(ids).success)
    return { error: 'Ordre invalide.' }
  try {
    const { client } = await session()
    const { error } = await client.rpc('reorder_tasks', { task_ids: ids })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { error: failure(error) }
  }
}
export async function saveTaskLabel(
  kind: 'project' | 'tag',
  id: string | null,
  input: { name: string; color: string }
) {
  const parsed = labelSchema.safeParse(input)
  if (
    !['project', 'tag'].includes(kind) ||
    (id && !z.uuid().safeParse(id).success) ||
    !parsed.success
  )
    return { error: 'Vérifiez le nom et la couleur.' }
  if (kind === 'tag' && parsed.data.name.length > 40)
    return { error: 'Un tag contient au maximum 40 caractères.' }
  try {
    const { client, user } = await session()
    const table = kind === 'project' ? 'task_projects' : 'task_tags'
    const result = id
      ? await client
          .from(table)
          .update(parsed.data)
          .eq('id', id)
          .eq('user_id', user.id)
          .select('id')
          .single()
      : await client
          .from(table)
          .insert({ ...parsed.data, user_id: user.id })
          .select('id')
          .single()
    if (result.error) throw result.error
    return { id: result.data.id as string }
  } catch (error) {
    return { error: failure(error) }
  }
}
export async function deleteTaskLabel(kind: 'project' | 'tag', id: string) {
  if (!['project', 'tag'].includes(kind) || !z.uuid().safeParse(id).success)
    return { error: 'Élément invalide.' }
  try {
    const { client, user } = await session()
    const { error } = await client
      .from(kind === 'project' ? 'task_projects' : 'task_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { error: failure(error) }
  }
}
