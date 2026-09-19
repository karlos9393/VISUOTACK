import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterTasks,
  inView,
  isOverdue,
  localDate,
  dueLabel
} from '../../src/lib/tasks/query.ts'
import { taskPatchSchema } from '../../src/lib/tasks/validation.ts'
const now = new Date(2026, 8, 19, 12, 0)
const defaults = {
  id: 'a',
  title: 'Écrire',
  description: '',
  priority: 0,
  status: 'todo',
  due_date: null,
  due_time: null,
  parent_task_id: null,
  project_id: null,
  someday: false,
  deleted_at: null,
  created_at: '2026-09-19T10:00:00Z',
  position: 0,
  tag_ids: []
}
const task = (patch) => ({ ...defaults, ...patch })
const filters = {
  search: '',
  project: '',
  tag: '',
  priority: '',
  status: '',
  due: '',
  sort: 'manual'
}
test('views distinguish inbox, someday, upcoming, completed and trash', () => {
  assert.ok(inView(task({}), 'inbox', now))
  assert.ok(!inView(task({ someday: true }), 'inbox', now))
  assert.ok(inView(task({ someday: true }), 'someday', now))
  assert.ok(inView(task({ due_date: '2026-09-20' }), 'upcoming', now))
  assert.ok(
    !inView(task({ due_date: '2026-09-19', status: 'done' }), 'today', now)
  )
  assert.ok(inView(task({ status: 'done' }), 'completed', now))
  assert.ok(inView(task({ deleted_at: '2026-09-19' }), 'trash', now))
  assert.ok(!inView(task({ deleted_at: '2026-09-19' }), 'all', now))
  assert.ok(!inView(task({ parent_task_id: 'parent' }), 'all', now))
})
test('overdue is local-date aware and honors optional due time', () => {
  assert.equal(localDate(now), '2026-09-19')
  assert.ok(isOverdue(task({ due_date: '2026-09-18' }), now))
  assert.ok(!isOverdue(task({ due_date: '2026-09-19' }), now))
  assert.ok(
    isOverdue(task({ due_date: '2026-09-19', due_time: '11:59:00' }), now)
  )
  assert.ok(
    !isOverdue(task({ due_date: '2026-09-19', due_time: '13:00:00' }), now)
  )
  assert.ok(!isOverdue(task({ due_date: '2026-09-18', status: 'done' }), now))
  assert.equal(
    dueLabel(task({ due_date: '2026-09-20', due_time: '09:00:00' }), now),
    'Demain · 09:00'
  )
})
test('filters compose and include descriptions in case-insensitive search', () => {
  const tasks = [
    task({
      id: 'a',
      description: 'CAMPAGNE Meta',
      tag_ids: ['tag'],
      priority: 3,
      project_id: 'project'
    }),
    task({ id: 'b' })
  ]
  assert.deepEqual(
    filterTasks(
      tasks,
      'all',
      {
        ...filters,
        search: 'campagne',
        tag: 'tag',
        priority: '3',
        project: 'project'
      },
      now
    ).map((t) => t.id),
    ['a']
  )
  assert.deepEqual(
    filterTasks(tasks, 'all', { ...filters, priority: '0' }, now).map(
      (t) => t.id
    ),
    ['b']
  )
})
test('sorts are stable and unscheduled tasks sort after dated tasks', () => {
  const tasks = [
    task({ id: 'a', priority: 1, position: 2 }),
    task({ id: 'b', priority: 4, position: 1, due_date: '2026-09-20' })
  ]
  assert.deepEqual(
    filterTasks(tasks, 'all', filters, now).map((t) => t.id),
    ['b', 'a']
  )
  assert.deepEqual(
    filterTasks(tasks, 'all', { ...filters, sort: 'priority' }, now).map(
      (t) => t.id
    ),
    ['b', 'a']
  )
  assert.deepEqual(
    filterTasks(tasks, 'all', { ...filters, sort: 'due' }, now).map(
      (t) => t.id
    ),
    ['b', 'a']
  )
  assert.equal(tasks[0].id, 'a')
})
test('write validation rejects invalid dates, times, privileges and recurrence', () => {
  for (const value of [
    { title: ' ' },
    { due_date: '2026-02-30' },
    { due_time: '25:00' },
    { user_id: 'other' },
    { recurrence_interval: 0 },
    { recurrence_weekdays: [8] },
    { priority: 5 },
    { position: Infinity }
  ])
    assert.equal(taskPatchSchema.safeParse(value).success, false)
  assert.equal(
    taskPatchSchema.safeParse({
      title: ' Valide ',
      due_date: '2028-02-29',
      recurrence_interval: 2
    }).success,
    true
  )
})
