-- Table app_config pour stocker les tokens et configs dynamiques
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seul le service role peut lire/écrire (pas de RLS publique)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Politique : aucun accès via les clients normaux (uniquement service_role / admin)
-- Le service_role bypass RLS par défaut, donc pas de policy nécessaire.

-- Insérer le token initial (à remplir manuellement)
INSERT INTO app_config (key, value) VALUES ('meta_instagram_access_token', '')
ON CONFLICT (key) DO NOTHING;
