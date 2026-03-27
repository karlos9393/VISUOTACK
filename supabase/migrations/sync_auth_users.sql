-- ============================================================
-- Migration : Synchronisation auth.users → public.users
-- ============================================================

-- 1. Diagnostic : trouver les users auth sans profil public
-- (à lancer manuellement dans le SQL Editor pour vérifier)
--
-- SELECT
--   au.id,
--   au.email,
--   au.created_at AS auth_created_at
-- FROM auth.users au
-- LEFT JOIN public.users pu ON pu.id = au.id
-- WHERE pu.id IS NULL;

-- 2. Backfill : insérer les profils manquants
INSERT INTO public.users (id, email, full_name, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  'setter',
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Trigger : créer automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'setter',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
