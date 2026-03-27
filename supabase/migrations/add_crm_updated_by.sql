-- ============================================================
-- Migration : Ajouter updated_by sur crm_daily_entries
-- ============================================================

-- 1. Ajouter la colonne updated_by (FK vers public.users pour permettre les joins PostgREST)
ALTER TABLE crm_daily_entries
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.users(id);

-- 2. Mettre à jour le trigger existant update_updated_at() pour aussi set updated_by
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger crm_entries_updated_at (BEFORE UPDATE) utilise déjà cette fonction.
-- Pas besoin de le recréer.

-- 3. Trigger INSERT : mettre updated_by sur les nouvelles lignes
CREATE OR REPLACE FUNCTION set_crm_updated_by_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crm_entries_set_updated_by_insert ON crm_daily_entries;
CREATE TRIGGER crm_entries_set_updated_by_insert
  BEFORE INSERT ON crm_daily_entries
  FOR EACH ROW EXECUTE FUNCTION set_crm_updated_by_on_insert();

-- 4. Backfill : pour les entrées existantes, updated_by = setter_id
UPDATE crm_daily_entries SET updated_by = setter_id WHERE updated_by IS NULL;
