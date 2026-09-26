import { cn } from '@/lib/utils'
import type { ConsoleIconName } from '@/lib/console/types'

// Couleur d'accent de chaque type de section (pastille d'icône et tags)
export const ICON_ACCENT: Record<ConsoleIconName, string> = {
  instagram: 'bg-pink-50 text-pink-600',
  tiktok: 'bg-gray-900 text-white',
  youtube: 'bg-red-50 text-red-600',
  webinar: 'bg-amber-50 text-amber-700',
  sparkles: 'bg-violet-50 text-violet-600',
  calendar: 'bg-primary-soft text-primary',
  magnet: 'bg-emerald-50 text-emerald-600',
  folder: 'bg-sky-50 text-sky-600',
}

const ICON_PATHS: Record<ConsoleIconName, string> = {
  // appareil photo
  instagram: 'M3 8a2 2 0 0 1 2-2h1.5l1.5-2h8l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zm9 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  // note de musique
  tiktok: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  // lecture vidéo
  youtube: 'M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7zm7 1.5v7l6-3.5-6-3.5z',
  // écran de présentation
  webinar: 'M3 4h18M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4M12 16v4m-4 0h8',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16 2.286 6.857L20 12l-5.714 2.143L12 21l-2.286-6.857L4 12l5.714-2.143L12 3z',
  calendar: 'M8 3v4m8-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1',
  // cadeau
  magnet: 'M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8m16-4H4v4h16V8zm-8 0v13m0-13H8.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8zm0 0h3.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
}

export function SectionIcon({ name, className }: { name: ConsoleIconName; className?: string }) {
  return (
    <span className={cn('flex flex-shrink-0 items-center justify-center rounded-xl', ICON_ACCENT[name], className)}>
      <svg className="h-1/2 w-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICON_PATHS[name]} />
      </svg>
    </span>
  )
}

function Icon({ d, className, strokeWidth = 2 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
    </svg>
  )
}

export const SearchIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
)
export const ExternalIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
)
export const CopyIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15V6a2 2 0 0 1 2-2h8" />
)
export const CheckIcon = ({ className }: { className?: string }) => (
  <Icon className={className} strokeWidth={2.5} d="m5 13 4 4L19 7" />
)
export const ArrowRightIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M5 12h14m-6-6 6 6-6 6" />
)
export const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M19 12H5m6 6-6-6 6-6" />
)
