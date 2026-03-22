-- Fix RLS content_posts — ajouter policy DELETE manquante
-- Les policies SELECT/INSERT/UPDATE existent déjà via fix_rls_recursion.sql
-- On les recrée proprement au cas où elles n'auraient pas été appliquées

DROP POLICY IF EXISTS "content_read_all" ON content_posts;
DROP POLICY IF EXISTS "content_write_manager" ON content_posts;
DROP POLICY IF EXISTS "content_update_manager" ON content_posts;
DROP POLICY IF EXISTS "content_delete_manager" ON content_posts;

CREATE POLICY "content_read_all" ON content_posts
  FOR SELECT USING (true);

CREATE POLICY "content_write_manager" ON content_posts
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('admin', 'manager')
  );

CREATE POLICY "content_update_manager" ON content_posts
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role') IN ('admin', 'manager')
  );

CREATE POLICY "content_delete_manager" ON content_posts
  FOR DELETE USING (
    (auth.jwt() ->> 'user_role') IN ('admin', 'manager')
  );
