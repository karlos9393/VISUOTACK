-- Métriques enrichies par post (rétention + acquisition)
-- Idempotent : sûr que la colonne existe déjà (ex. follows ajouté à la main) ou non.
ALTER TABLE post_insights_cache
  ADD COLUMN IF NOT EXISTS follows          INT     DEFAULT 0,  -- abonnés générés (fragile, reels récents)
  ADD COLUMN IF NOT EXISTS profile_visits   INT     DEFAULT 0,  -- visites de profil (fragile)
  ADD COLUMN IF NOT EXISTS avg_watch_time   NUMERIC DEFAULT 0,  -- temps de visionnage moyen (ms)
  ADD COLUMN IF NOT EXISTS total_watch_time BIGINT  DEFAULT 0;  -- temps de visionnage total (ms)
