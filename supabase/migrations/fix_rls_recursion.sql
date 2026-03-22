-- ============================================
-- FIX RLS RECURSION — CYGA Dashboard
-- ============================================
-- Exécuter ce fichier dans Supabase SQL Editor
-- ============================================

-- 1. Fonction qui injecte le rôle dans le JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = (event->>'user_id')::uuid;
  claims := event->'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"setter"');
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Donner les permissions nécessaires au hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================
-- 2. Supprimer TOUTES les anciennes policies
-- ============================================

-- Users
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_admin_read_all" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "manager_read_all" ON users;
DROP POLICY IF EXISTS "admin_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Setter logs
DROP POLICY IF EXISTS "setter_own_logs" ON setter_logs;
DROP POLICY IF EXISTS "manager_read_all_logs" ON setter_logs;

-- Revenue
DROP POLICY IF EXISTS "revenue_restricted" ON revenue_entries;

-- Weekly reports
DROP POLICY IF EXISTS "reports_restricted" ON weekly_reports;

-- Content posts
DROP POLICY IF EXISTS "content_read_all" ON content_posts;
DROP POLICY IF EXISTS "content_write_manager" ON content_posts;
DROP POLICY IF EXISTS "content_update_manager" ON content_posts;

-- Content snapshots
DROP POLICY IF EXISTS "snapshots_restricted" ON content_weekly_snapshots;

-- ============================================
-- 3. Recréer les policies SANS récursion
-- ============================================

-- USERS — chacun lit/modifie son propre profil (pas de sous-requête)
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- SETTER LOGS — setter: ses propres logs / admin+manager: tous
CREATE POLICY "setter_own_logs" ON setter_logs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "manager_read_all_logs" ON setter_logs
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );

-- REVENUE — admin et manager seulement
CREATE POLICY "revenue_admin_manager" ON revenue_entries
  FOR ALL USING (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );

-- WEEKLY REPORTS — admin et manager seulement
CREATE POLICY "reports_admin_manager" ON weekly_reports
  FOR ALL USING (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );

-- CONTENT POSTS — tous lisent, admin+manager écrivent
CREATE POLICY "content_read_all" ON content_posts
  FOR SELECT USING (true);

CREATE POLICY "content_write_manager" ON content_posts
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );

CREATE POLICY "content_update_manager" ON content_posts
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );

-- CONTENT WEEKLY SNAPSHOTS — admin et manager
CREATE POLICY "snapshots_admin_manager" ON content_weekly_snapshots
  FOR ALL USING (
    (auth.jwt() ->> 'user_role')::text IN ('admin', 'manager')
  );
