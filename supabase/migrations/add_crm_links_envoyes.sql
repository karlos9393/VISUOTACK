-- Ajouter la colonne links_envoyes (nombre de liens de call envoyés)
ALTER TABLE crm_daily_entries
  ADD COLUMN IF NOT EXISTS links_envoyes INTEGER NOT NULL DEFAULT 0;
