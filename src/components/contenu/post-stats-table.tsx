'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { updatePostStats } from '@/lib/actions/content'
import { platformBadge } from '@/lib/utils'
import type { ContentPost } from '@/lib/types'

interface PostStatsTableProps {
  posts: ContentPost[]
}

export function PostStatsTable({ posts }: PostStatsTableProps) {
  return (
    <Card>
      <CardTitle>Posts publiés — Stats</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4 font-medium">Titre</th>
              <th className="pb-3 px-2 font-medium">Plateforme</th>
              <th className="pb-3 px-2 font-medium">Format</th>
              <th className="pb-3 px-2 font-medium text-right">Vues</th>
              <th className="pb-3 px-2 font-medium text-right">Likes</th>
              <th className="pb-3 px-2 font-medium text-right">Commentaires</th>
              <th className="pb-3 px-2 font-medium text-right">Abonnés</th>
              <th className="pb-3 pl-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <InlineEditRow key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Aucun post publié cette semaine
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function InlineEditRow({ post }: { post: ContentPost }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const pb = platformBadge(post.platform)

  async function handleSave(formData: FormData) {
    setLoading(true)
    const result = await updatePostStats(post.id, formData)
    setLoading(false)

    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Stats mises à jour', 'success')
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-b bg-blue-50">
        <td className="py-2 pr-4 text-gray-900 font-medium">{post.title}</td>
        <td className="py-2 px-2"><Badge className={pb.className}>{pb.label}</Badge></td>
        <td className="py-2 px-2 text-gray-600 capitalize">{post.format}</td>
        <td colSpan={5} className="py-2 px-2">
          <form action={handleSave} className="flex items-center gap-2">
            <input name="views" type="number" defaultValue={post.views} className="w-20 px-2 py-1 border rounded text-right text-sm" />
            <input name="likes" type="number" defaultValue={post.likes} className="w-20 px-2 py-1 border rounded text-right text-sm" />
            <input name="comments" type="number" defaultValue={post.comments} className="w-20 px-2 py-1 border rounded text-right text-sm" />
            <input name="followers_gained" type="number" defaultValue={post.followers_gained} className="w-20 px-2 py-1 border rounded text-right text-sm" />
            <Button size="sm" type="submit" disabled={loading}>OK</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>X</Button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="py-3 pr-4 text-gray-900 font-medium">{post.title}</td>
      <td className="py-3 px-2"><Badge className={pb.className}>{pb.label}</Badge></td>
      <td className="py-3 px-2 text-gray-600 capitalize">{post.format}</td>
      <td className="py-3 px-2 text-right">{post.views.toLocaleString('fr-FR')}</td>
      <td className="py-3 px-2 text-right">{post.likes.toLocaleString('fr-FR')}</td>
      <td className="py-3 px-2 text-right">{post.comments.toLocaleString('fr-FR')}</td>
      <td className="py-3 px-2 text-right">{post.followers_gained}</td>
      <td className="py-3 pl-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Modifier
        </button>
      </td>
    </tr>
  )
}
