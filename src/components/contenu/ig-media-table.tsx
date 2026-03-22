'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { IgPostRow } from './ig-post-row'
import type { IGMedia } from '@/lib/services/instagram'

interface IgMediaTableProps {
  media: IGMedia[]
}

export function IgMediaTable({ media }: IgMediaTableProps) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <CardTitle>Posts Instagram</CardTitle>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-3 font-medium w-10"></th>
              <th className="pb-3 pr-4 font-medium">Caption</th>
              <th className="pb-3 px-2 font-medium">Date</th>
              <th className="pb-3 px-2 font-medium">Format</th>
              <th className="pb-3 px-2 font-medium text-right">Likes</th>
              <th className="pb-3 px-2 font-medium text-right">Comments</th>
              <th className="pb-3 px-2 font-medium text-right">Reach</th>
              <th className="pb-3 px-2 font-medium text-right">Impressions</th>
              <th className="pb-3 px-2 font-medium text-right">Saves</th>
              <th className="pb-3 pl-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {media.map((post) => (
              <IgPostRow key={post.id} post={post} />
            ))}
            {media.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400">
                  Aucun post Instagram trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
