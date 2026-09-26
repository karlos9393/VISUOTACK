// Types et helpers de LA CONSOLE — sans les données, importables côté client.
// Les liens eux-mêmes sont dans links.ts (serveur uniquement : ils ne partent pas
// dans le JS public, seulement dans la page rendue pour un admin).

export interface ConsoleLink {
  label: string
  url: string
  description?: string
  offFunnel?: boolean
}

export type ConsoleIconName =
  | 'instagram' | 'tiktok' | 'youtube' | 'webinar' | 'sparkles' | 'calendar' | 'magnet' | 'folder'

export interface ConsoleSection {
  id: string
  title: string
  description: string
  tags?: string[]
  icon: ConsoleIconName
  // 'funnel' = tunnel en étapes (groupe « Tunnels »), 'grid' = liens utiles
  layout: 'funnel' | 'grid'
  links: ConsoleLink[]
}

export interface ConsoleRow {
  link: ConsoleLink
  step?: number
  section: ConsoleSection
}

/** Lignes du tableau d'une section : étapes numérotées, puis les pages hors parcours. */
export function sectionRows(section: ConsoleSection): ConsoleRow[] {
  const steps = section.links.filter((link) => !link.offFunnel)
  const off = section.links.filter((link) => link.offFunnel)
  return [
    ...steps.map((link, i) => ({ link, section, step: section.layout === 'funnel' ? i + 1 : undefined })),
    ...off.map((link) => ({ link, section })),
  ]
}
