-- ═══════════════════════════════════════════════════════════════
-- Add UNIQUE constraint to cardio_sessions for upsert support
-- Migration: 00022_cardio_sessions_unique_constraint.sql
-- ═══════════════════════════════════════════════════════════════

-- Add UNIQUE constraint on (user_id, date) to support ON CONFLICT upsert
-- This matches the pattern used by other tracking tables like:
-- - body_tracking: UNIQUE(user_id, date)
-- - nutrition_compliance: UNIQUE(user_id, date)
-- - ped_trt_compliance: UNIQUE(user_id, date)

ALTER TABLE cardio_sessions
ADD CONSTRAINT cardio_sessions_user_id_date_key UNIQUE (user_id, date);
