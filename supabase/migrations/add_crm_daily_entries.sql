-- Migration: CRM Daily Entries (Activity Tracker)
-- Reproduit le fichier Excel de tracking d'activité des setters

-- Table principale : entrées journalières par setter
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

-- RLS
ALTER TABLE crm_daily_entries ENABLE ROW LEVEL SECURITY;

-- Setter peut lire/écrire ses propres données
CREATE POLICY "crm_setter_own_data" ON crm_daily_entries
  FOR ALL USING (setter_id = auth.uid());

-- Admin et manager peuvent tout lire
CREATE POLICY "crm_admin_read_all" ON crm_daily_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Vue avec métriques calculées (% Réponse, % Réponse FUP, % RDV/Message, % RDV/Réponse)
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
