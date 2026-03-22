'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface WeekNavigatorProps {
  currentOffset: number
}

export function WeekNavigator({ currentOffset }: WeekNavigatorProps) {
  const router = useRouter()

  function navigate(offset: number) {
    if (offset === 0) {
      router.push('?')
    } else {
      router.push(`?week=${offset}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => navigate(currentOffset + 1)}>
        ← Précédente
      </Button>
      {currentOffset > 0 && (
        <Button variant="secondary" size="sm" onClick={() => navigate(currentOffset - 1)}>
          Suivante →
        </Button>
      )}
      {currentOffset > 0 && (
        <Button variant="ghost" size="sm" onClick={() => navigate(0)}>
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  )
}
