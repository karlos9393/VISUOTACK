import { z } from 'zod'
const date = z.iso.date().nullable()
export const taskPatchSchema = z
  .object({
    title: z.string().trim().min(1, 'Le titre est obligatoire.').max(300),
    description: z.string().max(20000),
    status: z.enum(['todo', 'in_progress', 'done']),
    priority: z.number().int().min(0).max(4),
    due_date: date,
    due_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .nullable(),
    project_id: z.uuid().nullable(),
    parent_task_id: z.uuid().nullable(),
    position: z.number().finite(),
    someday: z.boolean(),
    is_urgent: z.boolean(),
    is_important: z.boolean(),
    recurrence_frequency: z.enum(['none', 'daily', 'weekly', 'monthly']),
    recurrence_interval: z.number().int().min(1).max(365),
    recurrence_weekdays: z.array(z.number().int().min(1).max(7)).max(7),
    recurrence_until: date,
    deleted_at: z.iso.datetime({ offset: true }).nullable(),
    tag_ids: z.array(z.uuid()).max(100)
  })
  .partial()
  .strict()
export const labelSchema = z
  .object({
    name: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
  })
  .strict()
