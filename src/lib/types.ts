export type Role = 'admin' | 'manager' | 'setter'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: Role
  avatar_url: string | null
  created_at: string
}

export interface SetterLog {
  id: string
  user_id: string
  date: string
  conversations: number
  qualified: number
  links_sent: number
  calls_booked: number
  calls_shown: number
  closes: number
  no_close_budget: number
  no_close_think: number
  no_close_trust: number
  no_close_competitor: number
  notes: string | null
  created_at: string
}

export interface CrmDailyEntry {
  id: string
  setter_id: string
  date: string
  messages_envoyes: number
  reponses: number
  fup_envoyes: number
  reponses_fup: number
  rdv_bookes: number
  links_envoyes: number
  created_at: string
  updated_at: string
  updated_by: string | null
  updater?: { full_name: string | null; email: string } | null
}

export type Platform = 'instagram' | 'youtube' | 'tiktok'
export type ContentFormat = 'reel' | 'carrousel' | 'story' | 'video' | 'short'
export type ContentStatus = 'idee' | 'en_prod' | 'planifie' | 'publie'

export interface ContentPost {
  id: string
  created_by: string
  title: string
  platform: Platform
  format: ContentFormat
  status: ContentStatus
  scheduled_at: string | null
  published_at: string | null
  views: number
  likes: number
  comments: number
  followers_gained: number
  notes: string | null
  created_at: string
}

export interface ContentWeeklySnapshot {
  id: string
  week_start: string
  posts_published: number
  total_views: number
  followers_start: number
  followers_end: number
  followers_gained: number
  best_post_id: string | null
  created_at: string
}

export type Offer = 'formation' | 'accompagnement' | 'dfy'
export type PaymentType = 'complet' | 'acompte' | 'solde'

export interface RevenueEntry {
  id: string
  created_by: string
  date: string
  amount: number
  offer: Offer
  client_name: string | null
  payment_type: PaymentType
  notes: string | null
  created_at: string
}

export interface WeeklyReport {
  id: string
  week_start: string
  total_conversations: number
  total_qualified: number
  total_links: number
  total_booked: number
  total_shown: number
  total_closes: number
  close_rate: number
  show_rate: number
  posts_published: number
  total_views: number
  followers_gained: number
  best_post_id: string | null
  ca_total: number
  ca_formation: number
  ca_accompagnement: number
  ca_dfy: number
  generated_at: string
  sent_at: string | null
}
