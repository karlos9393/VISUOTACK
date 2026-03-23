import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SetterAlertProps {
  hasTodayLog: boolean
}

export function SetterAlert({ hasTodayLog }: SetterAlertProps) {
  if (hasTodayLog) return null

  const today = new Date()
  const dateStr = format(today, 'dd MMMM', { locale: fr })

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p className="text-sm text-amber-800">
        Le setter n&apos;a pas encore rempli son setting aujourd&apos;hui ({dateStr})
      </p>
    </div>
  )
}
