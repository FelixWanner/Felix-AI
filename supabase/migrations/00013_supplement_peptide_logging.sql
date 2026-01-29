-- ═══════════════════════════════════════════════════════════════
-- Supplement & Peptide Detailed Logging
-- Migration: 00013_supplement_peptide_logging.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Update nutrition_compliance to use water_liters instead of boolean
ALTER TABLE nutrition_compliance
DROP COLUMN IF EXISTS water_sufficient CASCADE;

ALTER TABLE nutrition_compliance
ADD COLUMN IF NOT EXISTS water_liters DECIMAL(4,2) DEFAULT 0;

COMMENT ON COLUMN nutrition_compliance.water_liters IS 'Daily water intake in liters (target: 4L)';

-- 2. Create detailed supplement/peptide log table
CREATE TABLE IF NOT EXISTS supplement_peptide_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    substance_name TEXT NOT NULL,
    substance_type TEXT NOT NULL CHECK (substance_type IN ('supplement', 'peptide', 'medication')),
    dose TEXT NOT NULL, -- e.g. "500mg", "2 IU", "1 Tablette"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplement_peptide_log_user_date ON supplement_peptide_log(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_supplement_peptide_log_substance ON supplement_peptide_log(user_id, substance_name);

-- 3. RLS Policies
ALTER TABLE supplement_peptide_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own supplement_peptide_log" ON supplement_peptide_log;
CREATE POLICY "Users can manage their own supplement_peptide_log"
ON supplement_peptide_log FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Updated_at Trigger
DROP TRIGGER IF EXISTS set_timestamp ON supplement_peptide_log;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON supplement_peptide_log
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. Add statistics view for body tracking trends
CREATE OR REPLACE VIEW body_tracking_weekly_stats AS
SELECT
    user_id,
    DATE_TRUNC('week', date) AS week_start,
    AVG(weight_kg) AS avg_weight_kg,
    MIN(weight_kg) AS min_weight_kg,
    MAX(weight_kg) AS max_weight_kg,
    AVG(waist_cm) AS avg_waist_cm,
    AVG(blood_pressure_sys) AS avg_bp_sys,
    AVG(blood_pressure_dia) AS avg_bp_dia,
    AVG(resting_heart_rate) AS avg_resting_hr,
    COUNT(*) AS data_points
FROM body_tracking
WHERE weight_kg IS NOT NULL
GROUP BY user_id, DATE_TRUNC('week', date);

-- 6. Add statistics view for nutrition compliance trends
CREATE OR REPLACE VIEW nutrition_compliance_weekly_stats AS
SELECT
    user_id,
    DATE_TRUNC('week', date) AS week_start,
    COUNT(*) AS total_days,
    COUNT(*) FILTER (WHERE plan_followed = true) AS compliant_days,
    ROUND((COUNT(*) FILTER (WHERE plan_followed = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS compliance_percent,
    AVG(water_liters) AS avg_water_liters
FROM nutrition_compliance
GROUP BY user_id, DATE_TRUNC('week', date);

-- 7. Add statistics view for training volume trends
CREATE OR REPLACE VIEW training_volume_weekly_stats AS
SELECT
    ts.user_id,
    DATE_TRUNC('week', ts.date) AS week_start,
    COUNT(DISTINCT ts.id) AS total_sessions,
    COUNT(tset.id) AS total_sets,
    SUM(tset.weight_kg * tset.reps) AS total_volume,
    AVG(tset.rpe) AS avg_rpe,
    COUNT(*) FILTER (WHERE tset.is_pr = true) AS total_prs
FROM training_sessions ts
LEFT JOIN training_sets tset ON tset.session_id = ts.id
GROUP BY ts.user_id, DATE_TRUNC('week', ts.date);

COMMENT ON TABLE supplement_peptide_log IS 'Detailed log of supplement, peptide, and medication intake with exact time and dose';
COMMENT ON VIEW body_tracking_weekly_stats IS 'Weekly aggregated statistics for body metrics';
COMMENT ON VIEW nutrition_compliance_weekly_stats IS 'Weekly aggregated nutrition compliance statistics';
COMMENT ON VIEW training_volume_weekly_stats IS 'Weekly aggregated training volume and intensity statistics';
