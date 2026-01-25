-- ═══════════════════════════════════════════════════════════════
-- Add UNIQUE constraint to training_sessions for upsert support
-- Migration: 00023_training_sessions_unique_constraint.sql
-- ═══════════════════════════════════════════════════════════════

-- Add UNIQUE constraint on (user_id, date) to support ON CONFLICT upsert
-- This matches the pattern used by other tracking tables

ALTER TABLE training_sessions
ADD CONSTRAINT training_sessions_user_date_unique UNIQUE (user_id, date);
