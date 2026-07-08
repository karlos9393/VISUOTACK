-- Table des scripts associés aux médias Instagram (page "Le Générateur")
CREATE TABLE IF NOT EXISTS generateur_scripts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id         text UNIQUE NOT NULL,        -- id du média Instagram
  permalink        text,
  caption          text,                         -- snapshot de la légende au moment de l'édition
  script_hook      text,
  script_body      text,
  script_sections  jsonb,                        -- pour les scripts sectionnés à venir
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- RLS : admin uniquement
ALTER TABLE generateur_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generateur_admin_all" ON generateur_scripts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
