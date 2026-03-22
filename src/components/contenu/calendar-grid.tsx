'use client'

import { useState } from 'react'
import { format, isSameMonth } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PostForm } from './post-form'
import { platformBadge } from '@/lib/utils'
import type { ContentPost } from '@/lib/types'

interface CalendarGridProps {
  days: Date[]
  posts: ContentPost[]
  platformFilter: string
  currentMonth: Date
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendarGrid({ days, posts, platformFilter, currentMonth }: CalendarGridProps) {
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
      <div className="flex items-center gap-2 mb-3">
        <PlatformFilter current={platformFilter} />
        <div className="ml-auto">
          <Button size="sm" onClick={() => openCreate()}>
            + Nouveau post
          </Button>
        </div>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-gray-50 py-1.5 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const dayPosts = posts.filter((p) => p.scheduled_at === dateStr)
          const visiblePosts = dayPosts.slice(0, 2)
          const extraCount = dayPosts.length - 2

          return (
            <div
              key={dateStr}
              className={`bg-white min-h-[80px] max-h-[90px] p-1 flex flex-col ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
            >
              <button
                onClick={() => openCreate(dateStr)}
                className={`text-xs font-medium mb-0.5 w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-50 ${
                  isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-500'
                }`}
              >
                {format(day, 'd')}
              </button>
              <div className="flex-1 overflow-hidden space-y-0.5">
                {visiblePosts.map((post) => {
                  const pb = platformBadge(post.platform)
                  return (
                    <button
                      key={post.id}
                      onClick={() => openEdit(post)}
                      className="w-full text-left px-1 py-0.5 rounded border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white truncate flex items-center gap-1"
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(post.status)}`} />
                      <span className="text-[11px] font-medium text-gray-800 truncate">{post.title}</span>
                      <Badge className={`${pb.className} text-[9px] px-1 py-0 leading-tight flex-shrink-0`}>{post.format}</Badge>
                    </button>
                  )
                })}
                {extraCount > 0 && (
                  <button
                    onClick={() => openEdit(dayPosts[2])}
                    className="text-[10px] text-blue-600 font-medium hover:text-blue-700 pl-1"
                  >
                    +{extraCount} autre{extraCount > 1 ? 's' : ''}
                  </button>
                )}
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

function statusDot(status: string): string {
  switch (status) {
    case 'publie': return 'bg-green-500'
    case 'planifie': return 'bg-blue-500'
    case 'en_prod': return 'bg-yellow-500'
    default: return 'bg-gray-400'
  }
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
