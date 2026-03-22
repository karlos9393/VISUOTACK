import { Card } from './card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  className?: string
}

export function KpiCard({ title, value, subtitle, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p className={cn(
          'mt-2 text-sm font-medium',
          trend.value >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </Card>
  )
}
