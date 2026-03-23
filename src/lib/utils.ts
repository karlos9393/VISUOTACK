import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

export function formatDate(date: Date | string, fmt: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, fmt, { locale: fr })
}

export function getWeekRange(weekOffset: number = 0) {
  const now = new Date()
  const targetDate = subWeeks(now, weekOffset)
  const start = getWeekStart(targetDate)
  const end = getWeekEnd(targetDate)
  return { start, end }
}

export function conversionRate(from: number, to: number): number {
  if (from === 0) return 0
  return Math.round((to / from) * 100)
}

export function rateColor(rate: number): string {
  if (rate >= 50) return 'bg-[#EAF3DE] text-[#27500A]'
  if (rate >= 30) return 'bg-[#FAEEDA] text-[#633806]'
  return 'bg-[#FCEBEB] text-[#791F1F]'
}

export function statusColor(status: string): string {
  switch (status) {
    case 'idee': return 'bg-gray-100 text-gray-700'
    case 'en_prod': return 'bg-amber-100 text-amber-700'
    case 'planifie': return 'bg-blue-100 text-blue-700'
    case 'publie': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function platformBadge(platform: string): { label: string; className: string } {
  switch (platform) {
    case 'instagram': return { label: 'IG', className: 'bg-pink-100 text-pink-700' }
    case 'youtube': return { label: 'YT', className: 'bg-red-100 text-red-700' }
    case 'tiktok': return { label: 'TK', className: 'bg-gray-800 text-white' }
    default: return { label: platform, className: 'bg-gray-100 text-gray-700' }
  }
}
