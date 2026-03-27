-- Migration: Fix CRM visibility — all authenticated users see all data
-- Drop old restrictive policies
DROP POLICY IF EXISTS "crm_setter_own_data" ON crm_daily_entries;
DROP POLICY IF EXISTS "crm_admin_read_all" ON crm_daily_entries;

-- All authenticated users can READ all entries
CREATE POLICY "crm_read_all_authenticated" ON crm_daily_entries
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Setters can INSERT their own data
CREATE POLICY "crm_setter_insert_own" ON crm_daily_entries
  FOR INSERT WITH CHECK (setter_id = auth.uid());

-- Setters can UPDATE their own data
CREATE POLICY "crm_setter_update_own" ON crm_daily_entries
  FOR UPDATE USING (setter_id = auth.uid());

-- Admins/managers can INSERT for any setter
CREATE POLICY "crm_admin_insert_all" ON crm_daily_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Admins/managers can UPDATE any row
CREATE POLICY "crm_admin_update_all" ON crm_daily_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Only admins/managers can DELETE
CREATE POLICY "crm_admin_delete" ON crm_daily_entries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
