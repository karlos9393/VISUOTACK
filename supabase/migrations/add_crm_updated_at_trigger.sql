-- Trigger updated_at automatique sur crm_daily_entries
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_entries_updated_at
  BEFORE UPDATE ON crm_daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
