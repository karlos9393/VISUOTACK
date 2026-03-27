-- Migration: CRM partagé — une seule entrée par date, visible et éditable par tous
-- Fusionne les doublons, change la contrainte UNIQUE, ouvre les RLS INSERT/UPDATE

-- 1. Fusionner les doublons : garder la ligne la plus récente pour chaque date
DELETE FROM crm_daily_entries
WHERE id NOT IN (
  SELECT DISTINCT ON (date) id
  FROM crm_daily_entries
  ORDER BY date, updated_at DESC NULLS LAST
);

-- 2. Supprimer l'ancienne contrainte UNIQUE(setter_id, date)
ALTER TABLE crm_daily_entries DROP CONSTRAINT IF EXISTS crm_daily_entries_setter_id_date_key;

-- 3. Ajouter nouvelle contrainte UNIQUE(date) — une seule entrée par date
ALTER TABLE crm_daily_entries ADD CONSTRAINT crm_daily_entries_date_key UNIQUE (date);

-- 4. Remplacer les RLS INSERT/UPDATE par des policies ouvertes à tous les authentifiés
DROP POLICY IF EXISTS "crm_setter_insert_own" ON crm_daily_entries;
DROP POLICY IF EXISTS "crm_setter_update_own" ON crm_daily_entries;
DROP POLICY IF EXISTS "crm_admin_insert_all" ON crm_daily_entries;
DROP POLICY IF EXISTS "crm_admin_update_all" ON crm_daily_entries;

CREATE POLICY "crm_authenticated_insert" ON crm_daily_entries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "crm_authenticated_update" ON crm_daily_entries
  FOR UPDATE USING (auth.uid() IS NOT NULL);
