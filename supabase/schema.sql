-- CYGA Dashboard — Schéma SQL complet

-- Table users
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  full_name     text,
  role          text CHECK (role IN ('admin','manager','setter')) DEFAULT 'setter',
  avatar_url    text,
  created_at    timestamptz DEFAULT now()
);

-- Table setter_logs
CREATE TABLE setter_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id),
  date                date NOT NULL,
  conversations       int DEFAULT 0,
  qualified           int DEFAULT 0,
  links_sent          int DEFAULT 0,
  calls_booked        int DEFAULT 0,
  calls_shown         int DEFAULT 0,
  closes              int DEFAULT 0,
  no_close_budget     int DEFAULT 0,
  no_close_think      int DEFAULT 0,
  no_close_trust      int DEFAULT 0,
  no_close_competitor int DEFAULT 0,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Table content_posts
CREATE TABLE content_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by        uuid REFERENCES users(id),
  title             text NOT NULL,
  platform          text CHECK (platform IN ('instagram','youtube','tiktok')),
  format            text CHECK (format IN ('reel','carrousel','story','video','short')),
  status            text CHECK (status IN ('idee','en_prod','planifie','publie')) DEFAULT 'idee',
  scheduled_at      date,
  published_at      timestamptz,
  views             int DEFAULT 0,
  likes             int DEFAULT 0,
  comments          int DEFAULT 0,
  followers_gained  int DEFAULT 0,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

-- Table content_weekly_snapshots
CREATE TABLE content_weekly_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start        date NOT NULL UNIQUE,
  posts_published   int DEFAULT 0,
  total_views       int DEFAULT 0,
  followers_start   int DEFAULT 0,
  followers_end     int DEFAULT 0,
  followers_gained  int DEFAULT 0,
  best_post_id      uuid REFERENCES content_posts(id),
  created_at        timestamptz DEFAULT now()
);

-- Table revenue_entries
CREATE TABLE revenue_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    uuid REFERENCES users(id),
  date          date NOT NULL,
  amount        numeric(10,2) NOT NULL,
  offer         text CHECK (offer IN ('formation','accompagnement','dfy')),
  client_name   text,
  payment_type  text CHECK (payment_type IN ('complet','acompte','solde')) DEFAULT 'complet',
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- Table weekly_reports
CREATE TABLE weekly_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          date NOT NULL UNIQUE,
  total_conversations int,
  total_qualified     int,
  total_links         int,
  total_booked        int,
  total_shown         int,
  total_closes        int,
  close_rate          numeric(5,2),
  show_rate           numeric(5,2),
  posts_published     int,
  total_views         int,
  followers_gained    int,
  best_post_id        uuid REFERENCES content_posts(id),
  ca_total            numeric(10,2),
  ca_formation        numeric(10,2),
  ca_accompagnement   numeric(10,2),
  ca_dfy              numeric(10,2),
  generated_at        timestamptz DEFAULT now(),
  sent_at             timestamptz
);

-- Table crm_daily_entries (CRM Activity Tracker)
CREATE TABLE crm_daily_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setter_id        uuid REFERENCES users(id),
  date             date NOT NULL,
  messages_envoyes integer DEFAULT 0,
  reponses         integer DEFAULT 0,
  fup_envoyes      integer DEFAULT 0,
  reponses_fup     integer DEFAULT 0,
  rdv_bookes       integer DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(setter_id, date)
);

-- Vue CRM avec métriques calculées
CREATE VIEW crm_daily_with_metrics AS
SELECT
  *,
  CASE WHEN messages_envoyes > 0
    THEN ROUND(reponses::numeric / messages_envoyes * 100, 1)
    ELSE 0
  END AS pct_reponse,
  CASE WHEN fup_envoyes > 0
    THEN ROUND(reponses_fup::numeric / fup_envoyes * 100, 1)
    ELSE 0
  END AS pct_reponse_fup,
  CASE WHEN messages_envoyes > 0
    THEN ROUND(rdv_bookes::numeric / messages_envoyes * 100, 1)
    ELSE 0
  END AS pct_rdv_message,
  CASE WHEN (reponses + reponses_fup) > 0
    THEN ROUND(rdv_bookes::numeric / (reponses + reponses_fup) * 100, 1)
    ELSE 0
  END AS pct_rdv_reponse
FROM crm_daily_entries;

-- Row Level Security

ALTER TABLE setter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_weekly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users: chacun peut lire son propre profil, admin peut tout lire
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_admin_read_all" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Setter logs: setter peut lire/écrire ses propres logs
CREATE POLICY "setter_own_logs" ON setter_logs
  FOR ALL USING (user_id = auth.uid());

-- Manager et admin: accès lecture total aux setter_logs
CREATE POLICY "manager_read_all_logs" ON setter_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Revenue: admin et manager seulement
CREATE POLICY "revenue_restricted" ON revenue_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Weekly reports: admin et manager seulement
CREATE POLICY "reports_restricted" ON weekly_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Content posts: tous peuvent lire, manager et admin peuvent écrire
CREATE POLICY "content_read_all" ON content_posts
  FOR SELECT USING (true);
CREATE POLICY "content_write_manager" ON content_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );
CREATE POLICY "content_update_manager" ON content_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- Content weekly snapshots: admin et manager
CREATE POLICY "snapshots_restricted" ON content_weekly_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );

-- CRM daily entries: setter peut lire/écrire ses propres données
CREATE POLICY "crm_setter_own_data" ON crm_daily_entries
  FOR ALL USING (setter_id = auth.uid());

-- Admin et manager peuvent lire toutes les entrées CRM
CREATE POLICY "crm_admin_read_all" ON crm_daily_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','manager'))
  );
