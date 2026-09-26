import { notFound, redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { CONSOLE_SECTIONS, getConsoleSection } from '@/lib/console/links'
import { SectionView } from '@/components/console/section-view'

interface PageProps {
  params: Promise<{ section: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { section } = await params
  return { title: `${getConsoleSection(section)?.title ?? 'La console'} · Visuo Track` }
}

export default async function ConsoleSectionRoute({ params }: PageProps) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/')

  const { section: id } = await params
  const section = getConsoleSection(id)
  if (!section) notFound()

  return <SectionView section={section} sections={CONSOLE_SECTIONS} />
}
