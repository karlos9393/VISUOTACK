-- Table de liaison post Instagram <-> script du catalogue generateur_scripts.
-- Relation 1-1 : un post pointe vers au plus un script (media_id unique).
-- Le texte édité par-post vit dans script_override → la source (generateur_scripts)
-- n'est JAMAIS modifiée.
CREATE TABLE IF NOT EXISTS post_script_links (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id         text UNIQUE NOT NULL,   -- id du post Instagram
  script_id        text,                    -- generateur_scripts.id (stocké en text : robuste au type de la source)
  script_override  text,                    -- texte édité spécifique à ce post (null = utiliser contenu source)
  linked_at        timestamptz DEFAULT now()
);

-- RLS : admin uniquement
ALTER TABLE post_script_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_script_links_admin_all" ON post_script_links
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
