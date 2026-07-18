-- ============================================================
-- Migration : Refonte SUIVI SETTING (ex-KINDASAMA)
-- ------------------------------------------------------------
-- 100% ADDITIVE, RÉVERSIBLE et IDEMPOTENTE (ré-exécutable sans erreur).
-- Basée sur le schéma RÉEL de prod, vérifié via PostgREST :
--   colonnes existantes : id, setter_id, date, messages_envoyes, reponses,
--   fup_envoyes, reponses_fup, rdv_bookes, created_at, updated_at, updated_by
--
--   • RENAME messages_envoyes → outbound_envoyes   (préserve l'historique)
--   • RENAME reponses         → reponses_outbound  (préserve l'historique)
--   • ADD liens_rdv_envoyes (absent en prod), conversations_entrantes,
--         rdv_qualifies, setter_present, notes
--   • Recréation de la vue crm_daily_with_metrics (nouveaux noms + KPI)
-- Modèle PARTAGÉ conservé : aucune contrainte modifiée.
--
-- ⚠️ À exécuter sur le projet PROD (uxvkhkkxrnizhuhiodwl), SQL editor du dashboard.
-- ============================================================

BEGIN;

-- 0. La vue dépend des colonnes : on la retire d'abord, on la recrée à la fin.
DROP VIEW IF EXISTS crm_daily_with_metrics;

-- 1. Renommer messages_envoyes → outbound_envoyes (seulement si nécessaire)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'crm_daily_entries'
              AND column_name = 'messages_envoyes')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'crm_daily_entries'
              AND column_name = 'outbound_envoyes') THEN
    ALTER TABLE crm_daily_entries RENAME COLUMN messages_envoyes TO outbound_envoyes;
  END IF;
END $$;

-- 2. Renommer reponses → reponses_outbound (seulement si nécessaire)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'crm_daily_entries'
              AND column_name = 'reponses')
   AND NOT EXISTS (SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'crm_daily_entries'
              AND column_name = 'reponses_outbound') THEN
    ALTER TABLE crm_daily_entries RENAME COLUMN reponses TO reponses_outbound;
  END IF;
END $$;

-- 3. Ajouter les colonnes manquantes (dont liens_rdv_envoyes, absent en prod)
ALTER TABLE crm_daily_entries
  ADD COLUMN IF NOT EXISTS conversations_entrantes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liens_rdv_envoyes       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rdv_qualifies           integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setter_present          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes                   text;

-- 4. Recréer la vue avec les nouveaux noms + les KPI
CREATE VIEW crm_daily_with_metrics AS
SELECT
  *,
  CASE WHEN conversations_entrantes > 0
    THEN ROUND(rdv_bookes::numeric / conversations_entrantes * 100, 1) END AS pct_rdv_conv,
  CASE WHEN outbound_envoyes > 0
    THEN ROUND(reponses_outbound::numeric / outbound_envoyes * 100, 1) END AS pct_rep,
  CASE WHEN fup_envoyes > 0
    THEN ROUND(reponses_fup::numeric / fup_envoyes * 100, 1) END AS pct_rep_fup,
  CASE WHEN outbound_envoyes > 0
    THEN ROUND(rdv_bookes::numeric / outbound_envoyes * 100, 1) END AS pct_rdv_outbound,
  CASE WHEN (reponses_outbound + reponses_fup) > 0
    THEN ROUND(rdv_bookes::numeric / (reponses_outbound + reponses_fup) * 100, 1) END AS pct_rdv_rep,
  CASE WHEN liens_rdv_envoyes > 0
    THEN ROUND(rdv_bookes::numeric / liens_rdv_envoyes * 100, 1) END AS pct_liens_rdv,
  CASE WHEN rdv_bookes > 0
    THEN ROUND(rdv_qualifies::numeric / rdv_bookes * 100, 1) END AS pct_qualif
FROM crm_daily_entries;

COMMIT;

-- ============================================================
-- ROLLBACK (si besoin) :
--   BEGIN;
--   DROP VIEW IF EXISTS crm_daily_with_metrics;
--   ALTER TABLE crm_daily_entries RENAME COLUMN outbound_envoyes  TO messages_envoyes;
--   ALTER TABLE crm_daily_entries RENAME COLUMN reponses_outbound TO reponses;
--   ALTER TABLE crm_daily_entries
--     DROP COLUMN IF EXISTS conversations_entrantes,
--     DROP COLUMN IF EXISTS liens_rdv_envoyes,
--     DROP COLUMN IF EXISTS rdv_qualifies,
--     DROP COLUMN IF EXISTS setter_present,
--     DROP COLUMN IF EXISTS notes;
--   COMMIT;
-- ============================================================
