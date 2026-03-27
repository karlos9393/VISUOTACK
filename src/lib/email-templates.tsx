import * as React from 'react'

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://your-app.vercel.app' : 'http://localhost:3000'

interface EmailLayoutProps {
  children: React.ReactNode
}

function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#1f2937', fontSize: '20px', margin: 0 }}>CYGA</h1>
      </div>
      {children}
      <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '12px' }}>
        CYGA Dashboard — Email automatique
      </div>
    </div>
  )
}

export function SetterReminderEmail({ firstName }: { firstName: string }) {
  return (
    <EmailLayout>
      <p style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>
        Bonsoir {firstName}, n&apos;oublie pas de remplir ton setting du jour avant de dormir.
      </p>
      <a
        href={`${baseUrl}/crm-tracker/setting`}
        style={{
          display: 'inline-block',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
          marginTop: '15px',
        }}
      >
        Remplir mon setting
      </a>
    </EmailLayout>
  )
}

export function SetterInactiveAlertEmail({ date }: { date: string }) {
  return (
    <EmailLayout>
      <p style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>
        <strong style={{ color: '#dc2626' }}>Attention</strong> — le setter n&apos;a eu aucune activité aujourd&apos;hui ({date}).
      </p>
      <p style={{ color: '#6b7280', fontSize: '13px' }}>
        Conversations = 0 et liens envoyés = 0.
      </p>
    </EmailLayout>
  )
}

interface WeeklyReportData {
  weekStart: string
  conversations: number
  closes: number
  closeRate: number
  showRate: number
  caWeek: number
  postsPublished: number
  totalViews: number
  followersGained: number
  bestPostTitle: string
  attention: string
}

export function WeeklyReportEmail(data: WeeklyReportData) {
  return (
    <EmailLayout>
      <h2 style={{ color: '#1f2937', fontSize: '16px', marginBottom: '20px' }}>
        Rapport CYGA — Semaine du {data.weekStart}
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
          PIPELINE
        </h3>
        <table style={{ width: '100%', fontSize: '13px', color: '#4b5563' }}>
          <tbody>
            <tr><td style={{ padding: '4px 0' }}>Conversations</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.conversations}</td></tr>
            <tr><td style={{ padding: '4px 0' }}>Closes</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.closes} (taux: {data.closeRate}%)</td></tr>
            <tr><td style={{ padding: '4px 0' }}>Show rate</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.showRate}%</td></tr>
            <tr><td style={{ padding: '4px 0' }}>CA semaine</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.caWeek}€</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#374151', fontSize: '14px', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
          CONTENU
        </h3>
        <table style={{ width: '100%', fontSize: '13px', color: '#4b5563' }}>
          <tbody>
            <tr><td style={{ padding: '4px 0' }}>Posts publiés</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.postsPublished}</td></tr>
            <tr><td style={{ padding: '4px 0' }}>Vues totales</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.totalViews}</td></tr>
            <tr><td style={{ padding: '4px 0' }}>Abonnés gagnés</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.followersGained}</td></tr>
            <tr><td style={{ padding: '4px 0' }}>Meilleur post</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{data.bestPostTitle}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
          Point d&apos;attention
        </p>
        <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#78350f' }}>
          {data.attention}
        </p>
      </div>

      <a
        href={`${baseUrl}/revenue`}
        style={{
          display: 'inline-block',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        Voir le rapport complet
      </a>
    </EmailLayout>
  )
}
