'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PostForm } from './post-form'
import { statusColor, platformBadge } from '@/lib/utils'
import type { ContentPost } from '@/lib/types'

interface CalendarGridProps {
  days: Date[]
  posts: ContentPost[]
  platformFilter: string
  viewMode: string
}

export function CalendarGrid({ days, posts, platformFilter }: CalendarGridProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editPost, setEditPost] = useState<ContentPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  function openCreate(date?: string) {
    setEditPost(null)
    setSelectedDate(date || '')
    setModalOpen(true)
  }

  function openEdit(post: ContentPost) {
    setEditPost(post)
    setSelectedDate('')
    setModalOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <PlatformFilter current={platformFilter} />
        <div className="ml-auto">
          <Button size="sm" onClick={() => openCreate()}>
            + Nouveau post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayPosts = posts.filter((p) => p.scheduled_at === dateStr)

          return (
            <div key={dateStr} className="min-h-[140px]">
              <div className="text-xs font-medium text-gray-500 mb-2 capitalize">
                {format(day, 'EEE dd', { locale: fr })}
              </div>
              <div className="space-y-2">
                {dayPosts.map((post) => {
                  const pb = platformBadge(post.platform)
                  return (
                    <button
                      key={post.id}
                      onClick={() => openEdit(post)}
                      className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Badge className={pb.className}>{pb.label}</Badge>
                        <Badge className={statusColor(post.status)}>{post.status}</Badge>
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2">{post.title}</p>
                    </button>
                  )
                })}
                <button
                  onClick={() => openCreate(dateStr)}
                  className="w-full text-center py-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPost ? 'Modifier le post' : 'Nouveau post'}
      >
        <PostForm
          post={editPost}
          defaultDate={selectedDate}
          onDone={() => setModalOpen(false)}
        />
      </Modal>
    </>
  )
}

function PlatformFilter({ current }: { current: string }) {
  const platforms = [
    { value: 'all', label: 'Tous' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
  ]

  return (
    <div className="flex gap-1">
      {platforms.map((p) => (
        <a
          key={p.value}
          href={`?platform=${p.value}`}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            current === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </a>
      ))}
    </div>
  )
}
