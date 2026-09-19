'use client'
import { useState } from 'react'
import type { TasksController } from '@/hooks/use-tasks'
import { TaskDialog } from './task-dialog'
import { Button } from '@/components/ui/button'
import { fieldClass } from './task-fields'
export function LabelManager({
  kind,
  controller,
  onClose
}: {
  kind: 'project' | 'tag'
  controller: TasksController
  onClose: () => void
}) {
  const [id, setId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#E8564B')
  const [deleting, setDeleting] = useState<string | null>(null)
  const labels =
    kind === 'project' ? controller.data.projects : controller.data.tags
  const reset = () => {
    setId(null)
    setName('')
    setColor('#E8564B')
  }
  return (
    <TaskDialog
      title={kind === 'project' ? 'Gérer les projets' : 'Gérer les tags'}
      onClose={() => {
        if (!controller.pending) onClose()
      }}
    >
      <div className="space-y-5">
        {controller.error && (
          <p role="alert" className="text-sm text-red-600">
            {controller.error}
          </p>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (await controller.saveLabel(kind, id, { name, color })) reset()
          }}
          className="space-y-3"
        >
          <label className="block space-y-1 text-xs text-gray-500">
            <span>Nom {kind === 'project' ? 'du projet' : 'du tag'}</span>
            <input
              autoFocus
              aria-label="Nom"
              value={name}
              maxLength={kind === 'project' ? 80 : 40}
              required
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Couleur
              <input
                aria-label="Couleur"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-9 cursor-pointer rounded border border-gray-200 bg-white"
              />
            </label>
            <Button
              disabled={controller.pending || !name.trim()}
              size="sm"
              type="submit"
            >
              {id ? 'Enregistrer' : 'Créer'}
            </Button>
            {id && (
              <Button size="sm" type="button" variant="ghost" onClick={reset}>
                Annuler
              </Button>
            )}
          </div>
        </form>
        <div className="space-y-2 border-t border-gray-100 pt-4">
          {!labels.length && (
            <p className="py-4 text-center text-sm text-gray-400">
              {kind === 'project'
                ? 'Aucun projet pour le moment.'
                : 'Aucun tag pour le moment.'}
            </p>
          )}
          {labels.map((label) => (
            <div
              key={label.id}
              className="rounded-xl border border-gray-100 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: label.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {label.name}
                </span>
                <button
                  disabled={controller.pending}
                  onClick={() => {
                    setId(label.id)
                    setName(label.name)
                    setColor(label.color)
                    setDeleting(null)
                  }}
                  className="text-xs text-gray-500"
                >
                  Modifier
                </button>
                <button
                  disabled={controller.pending}
                  onClick={() => setDeleting(label.id)}
                  className="text-xs text-red-500"
                >
                  Supprimer
                </button>
              </div>
              {deleting === label.id && (
                <div className="mt-3 space-y-2 text-xs text-gray-500">
                  <p>
                    {kind === 'project'
                      ? 'Supprimer ce projet ? Ses tâches seront conservées sans projet.'
                      : 'Supprimer ce tag de toutes vos tâches ?'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      disabled={controller.pending}
                      onClick={async () => {
                        if (await controller.deleteLabel(kind, label.id)) {
                          setDeleting(null)
                          if (id === label.id) reset()
                        }
                      }}
                      className="text-red-500"
                    >
                      Confirmer
                    </button>
                    <button onClick={() => setDeleting(null)}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </TaskDialog>
  )
}
