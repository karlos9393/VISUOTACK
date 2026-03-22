'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { createContentPost, updateContentPost } from '@/lib/actions/content'
import type { ContentPost } from '@/lib/types'

interface PostFormProps {
  post: ContentPost | null
  defaultDate?: string
  onDone: () => void
}

export function PostForm({ post, defaultDate, onDone }: PostFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')

    const result = post
      ? await updateContentPost(post.id, formData)
      : await createContentPost(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    toast(post ? 'Post mis à jour' : 'Post créé', 'success')
    onDone()
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        label="Titre"
        name="title"
        defaultValue={post?.title || ''}
        required
      />
      <Select
        label="Plateforme"
        name="platform"
        defaultValue={post?.platform || 'instagram'}
        options={[
          { value: 'instagram', label: 'Instagram' },
          { value: 'youtube', label: 'YouTube' },
          { value: 'tiktok', label: 'TikTok' },
        ]}
      />
      <Select
        label="Format"
        name="format"
        defaultValue={post?.format || 'reel'}
        options={[
          { value: 'reel', label: 'Reel' },
          { value: 'carrousel', label: 'Carrousel' },
          { value: 'story', label: 'Story' },
          { value: 'video', label: 'Vidéo' },
          { value: 'short', label: 'Short' },
        ]}
      />
      <Select
        label="Statut"
        name="status"
        defaultValue={post?.status || 'idee'}
        options={[
          { value: 'idee', label: 'Idée' },
          { value: 'en_prod', label: 'En production' },
          { value: 'planifie', label: 'Planifié' },
          { value: 'publie', label: 'Publié' },
        ]}
      />
      <Input
        label="Date planifiée"
        name="scheduled_at"
        type="date"
        defaultValue={post?.scheduled_at || defaultDate || ''}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={post?.notes || ''}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Enregistrement...' : post ? 'Mettre à jour' : 'Créer'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
