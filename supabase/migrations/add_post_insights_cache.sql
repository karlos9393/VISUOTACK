-- Cache des insights par post Instagram (TTL 6h)
CREATE TABLE IF NOT EXISTS post_insights_cache (
  post_id        TEXT PRIMARY KEY,
  media_type     TEXT,
  impressions    INT DEFAULT 0,
  reach          INT DEFAULT 0,
  saved          INT DEFAULT 0,
  video_views    INT DEFAULT 0,
  plays          INT DEFAULT 0,
  shares         INT DEFAULT 0,
  fetched_at     TIMESTAMPTZ DEFAULT now()
);

-- RLS activé, uniquement accessible via service_role
ALTER TABLE post_insights_cache ENABLE ROW LEVEL SECURITY;

-- Policy pour que les users authentifiés puissent lire le cache
CREATE POLICY "Authenticated users can read insights cache"
  ON post_insights_cache FOR SELECT
  TO authenticated
  USING (true);
