-- Suivi de l'expiration du token Instagram dans app_config.
-- La valeur est soit 'never' (System User permanent), soit une date ISO 8601,
-- soit '' si inconnue. Mise à jour par les crons refresh-meta-token & token-health
-- et par l'action admin updateInstagramToken.
INSERT INTO app_config (key, value) VALUES ('meta_instagram_token_expires_at', '')
ON CONFLICT (key) DO NOTHING;
