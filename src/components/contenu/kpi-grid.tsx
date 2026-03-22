'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiItem {
  title: string
  value: string | number
  subtitle?: string
  trend?: number | null
}

interface KpiGridProps {
  items: KpiItem[]
  bestPost?: {
    thumbnail?: string
    caption: string
    views: number
    likes: number
  } | null
}

export function KpiGrid({ items, bestPost }: KpiGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <Card key={item.title} className="flex flex-col py-4 px-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
            {item.subtitle && (
              <p className="mt-0.5 text-xs text-gray-400">{item.subtitle}</p>
            )}
            {item.trend !== null && item.trend !== undefined && (
              <p className={cn(
                'mt-1 text-xs font-medium',
                item.trend >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {item.trend >= 0 ? '+' : ''}{item.trend}% vs préc.
              </p>
            )}
          </Card>
        ))}
      </div>

      {bestPost && (
        <Card className="flex items-center gap-4 py-4 px-5 bg-amber-50 border-amber-200">
          {bestPost.thumbnail ? (
            <img
              src={bestPost.thumbnail}
              alt=""
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-amber-200 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Meilleur post de la période</p>
            <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{bestPost.caption}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 text-sm">
            <div className="text-center">
              <p className="font-bold text-gray-900">{bestPost.views.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-gray-500">vues</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{bestPost.likes.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-gray-500">likes</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
