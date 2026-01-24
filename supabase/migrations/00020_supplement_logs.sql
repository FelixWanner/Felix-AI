-- ═══════════════════════════════════════════════════════════════
-- Supplement Logs - Detailliertes Tracking
-- Migration: 00020_daily_supplement_tracking.sql
-- ═══════════════════════════════════════════════════════════════

-- Tabelle für detailliertes Supplement-Tracking
CREATE TABLE IF NOT EXISTS daily_supplement_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_name TEXT NOT NULL, -- 'nuechtern', 'mahlzeit_1', 'pre_workout', etc.
    supplement_name TEXT NOT NULL,
    taken BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, slot_name, supplement_name)
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_daily_supplement_tracking_user_date
    ON daily_supplement_tracking(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_supplement_tracking_slot
    ON daily_supplement_tracking(user_id, slot_name, date DESC);

-- RLS aktivieren
ALTER TABLE daily_supplement_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Daten sehen/bearbeiten
DROP POLICY IF EXISTS "Users can manage their own daily_supplement_tracking" ON daily_supplement_tracking;
CREATE POLICY "Users can manage their own daily_supplement_tracking"
    ON daily_supplement_tracking FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Updated_at Trigger
DROP TRIGGER IF EXISTS set_timestamp ON daily_supplement_tracking;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON daily_supplement_tracking
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE daily_supplement_tracking IS 'Detailed daily supplement intake tracking with notes';
