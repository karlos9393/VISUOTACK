-- Métrique "views" (API Meta v22) : vues réelles des reels/vidéos.
-- Avant cette colonne, on tentait de reconstruire les vues depuis plays/impressions,
-- que l'API v22 ne renvoie plus pour les vidéos → cache empoisonné à 0.
-- Idempotent.
ALTER TABLE post_insights_cache
  ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
