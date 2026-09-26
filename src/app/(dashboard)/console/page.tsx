import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { ConsoleHome } from '@/components/console/console-home'
import { CONSOLE_SECTIONS } from '@/lib/console/links'

export const metadata = { title: 'La console · Visuo Track' }

export default async function ConsoleRoute() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/')

  return <ConsoleHome sections={CONSOLE_SECTIONS} />
}
