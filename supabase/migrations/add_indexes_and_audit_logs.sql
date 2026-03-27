-- Indexes pour améliorer les performances des requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_setter_logs_date ON setter_logs(date);
CREATE INDEX IF NOT EXISTS idx_setter_logs_user_date ON setter_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_crm_daily_entries_date ON crm_daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_crm_daily_entries_setter_date ON crm_daily_entries(setter_id, date);

-- Table d'audit pour les actions admin
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS sur audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "Server can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
