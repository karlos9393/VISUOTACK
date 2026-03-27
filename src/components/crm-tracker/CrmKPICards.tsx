'use client'

import type { CrmDailyEntry } from '@/lib/types'

interface CrmKPICardsProps {
  entries: CrmDailyEntry[]
}

export function CrmKPICards({ entries }: CrmKPICardsProps) {
  const totals = entries.reduce(
    (acc, e) => ({
      messages_envoyes: acc.messages_envoyes + e.messages_envoyes,
      reponses: acc.reponses + e.reponses,
      fup_envoyes: acc.fup_envoyes + e.fup_envoyes,
      reponses_fup: acc.reponses_fup + e.reponses_fup,
      rdv_bookes: acc.rdv_bookes + e.rdv_bookes,
    }),
    { messages_envoyes: 0, reponses: 0, fup_envoyes: 0, reponses_fup: 0, rdv_bookes: 0 }
  )

  const pctReponse = totals.messages_envoyes > 0
    ? Math.round(totals.reponses / totals.messages_envoyes * 100)
    : 0

  const pctRdvMsg = totals.messages_envoyes > 0
    ? Math.round(totals.rdv_bookes / totals.messages_envoyes * 100)
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={<MessageIcon />}
        label="Messages"
        value={String(totals.messages_envoyes)}
        sub="total envoy&eacute;s"
        color="bg-purple-50 text-purple-700"
        iconBg="bg-purple-100"
      />
      <KPICard
        icon={<ReplyIcon />}
        label="R&eacute;ponses"
        value={`${totals.reponses} (${pctReponse}%)`}
        sub="total re&ccedil;ues"
        color="bg-blue-50 text-blue-700"
        iconBg="bg-blue-100"
      />
      <KPICard
        icon={<FupIcon />}
        label="FUP"
        value={String(totals.fup_envoyes)}
        sub={`${totals.reponses_fup} r\u00e9p.`}
        color="bg-teal-50 text-teal-700"
        iconBg="bg-teal-100"
      />
      <KPICard
        icon={<CalendarIcon />}
        label="RDV book&eacute;s"
        value={`${totals.rdv_bookes} (${pctRdvMsg}%)`}
        sub="total mois"
        color="bg-green-50 text-green-700"
        iconBg="bg-green-100"
      />
    </div>
  )
}

function KPICard({
  icon,
  label,
  value,
  sub,
  color,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
  iconBg: string
}) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{sub}</p>
    </div>
  )
}

function MessageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function FupIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
