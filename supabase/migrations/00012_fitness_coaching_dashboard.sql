-- ═══════════════════════════════════════════════════════════════
-- Fitness & Coaching Dashboard
-- Migration: 00012_fitness_coaching_dashboard.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Körper & Progress Tracking
CREATE TABLE IF NOT EXISTS body_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    blood_pressure_sys INTEGER,
    blood_pressure_dia INTEGER,
    resting_heart_rate INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_body_tracking_user_date ON body_tracking(user_id, date DESC);

-- 2. Weekly Progress Photos
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    front_photo_url TEXT,
    side_left_photo_url TEXT,
    back_photo_url TEXT,
    side_right_photo_url TEXT,
    photos_complete BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON progress_photos(user_id, week_start_date DESC);

-- 3. Ernährungs-Compliance (täglich)
CREATE TABLE IF NOT EXISTS nutrition_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plan_followed BOOLEAN DEFAULT true,
    deviation_reason TEXT,
    deviation_category TEXT, -- 'geschaeftsessen', 'reise', 'krankheit', 'sonstiges'
    meal_replaced TEXT, -- welche Mahlzeit
    water_sufficient BOOLEAN,
    salt_sufficient BOOLEAN,
    ingredients_weighed BOOLEAN,
    post_workout_part1_correct BOOLEAN,
    post_workout_part2_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_compliance_user_date ON nutrition_compliance(user_id, date DESC);

-- 4. Training Plan Definition
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    days_per_week INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);

-- 5. Training Session (z.B. Tag 1, Tag 2, Tag 3)
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    session_name TEXT, -- 'Tag 1', 'Tag 2', etc.
    start_time TIME,
    end_time TIME,
    plan_followed BOOLEAN DEFAULT true,
    deviation_reason TEXT, -- 'übung_besetzt', 'schmerz', 'zeitslot'
    intensity_discipline BOOLEAN DEFAULT true, -- nur letzter Satz bis Muskelversagen
    rest_day_violated BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date ON training_sessions(user_id, date DESC);

-- 6. Training Sets (Satz-Daten)
CREATE TABLE IF NOT EXISTS training_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg DECIMAL(6,2),
    reps INTEGER,
    rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10), -- Rate of Perceived Exertion
    is_pr BOOLEAN DEFAULT false, -- Personal Record
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_sets_session ON training_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_training_sets_exercise ON training_sets(user_id, exercise_name, created_at DESC);

-- 7. Cardio Tracking
CREATE TABLE IF NOT EXISTS cardio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    cardio_type TEXT, -- 'nüchtern', 'post_workout'
    duration_minutes INTEGER,
    avg_heart_rate INTEGER,
    hr_range_low INTEGER,
    hr_range_high INTEGER,
    cardio_before_strength BOOLEAN DEFAULT false, -- sollte false sein!
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cardio_sessions_user_date ON cardio_sessions(user_id, date DESC);

-- 8. Supplement Compliance
CREATE TABLE IF NOT EXISTS supplement_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_name TEXT NOT NULL, -- 'nüchtern', 'mahlzeit_1', 'pre', 'intra', 'post', 'letzte_mahlzeit', 'vor_schlafen'
    supplements TEXT[], -- Array of supplement names
    is_mandatory BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_supplement_slots_user ON supplement_slots(user_id, sort_order);

CREATE TABLE IF NOT EXISTS supplement_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_name TEXT NOT NULL,
    taken BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_supplement_compliance_user_date ON supplement_compliance(user_id, date DESC);

-- 9. PED/TRT Compliance
CREATE TABLE IF NOT EXISTS ped_trt_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plan_followed BOOLEAN DEFAULT true,
    deviation_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ped_trt_compliance_user_date ON ped_trt_compliance(user_id, date DESC);

-- 10. Weekly Update Data
CREATE TABLE IF NOT EXISTS weekly_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    avg_weight_kg DECIMAL(5,2),
    weight_change_kg DECIMAL(4,2),
    training_sessions_planned INTEGER,
    training_sessions_completed INTEGER,
    cardio_sessions_planned INTEGER,
    cardio_sessions_completed INTEGER,
    nutrition_compliance_percent DECIMAL(5,2),
    training_compliance_percent DECIMAL(5,2),
    supplement_compliance_percent DECIMAL(5,2),
    deviations_summary TEXT,
    wellbeing_avg DECIMAL(3,2),
    stress_avg DECIMAL(3,2),
    sleep_quality_avg DECIMAL(3,2),
    notes TEXT,
    export_text TEXT, -- WhatsApp-ready text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_updates_user ON weekly_updates(user_id, week_start_date DESC);

-- 11. RLS Policies
ALTER TABLE body_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ped_trt_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;

-- Policies für alle Tabellen
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN
        SELECT unnest(ARRAY[
            'body_tracking', 'progress_photos', 'nutrition_compliance',
            'training_plans', 'training_sessions', 'training_sets',
            'cardio_sessions', 'supplement_slots', 'supplement_compliance',
            'ped_trt_compliance', 'weekly_updates'
        ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Users can manage their own %I" ON %I;
            CREATE POLICY "Users can manage their own %I"
            ON %I FOR ALL TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- 12. Updated_at Triggers
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN
        SELECT unnest(ARRAY[
            'body_tracking', 'progress_photos', 'nutrition_compliance',
            'training_plans', 'training_sessions', 'training_sets',
            'cardio_sessions', 'supplement_slots', 'supplement_compliance',
            'ped_trt_compliance', 'weekly_updates'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_timestamp ON %I;
            CREATE TRIGGER set_timestamp BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
        ', table_name, table_name);
    END LOOP;
END $$;

-- 13. Helper Function: Calculate Weekly Compliance
CREATE OR REPLACE FUNCTION calculate_weekly_compliance(
    p_user_id UUID,
    p_week_start DATE
)
RETURNS TABLE (
    nutrition_compliance DECIMAL,
    training_compliance DECIMAL,
    supplement_compliance DECIMAL,
    avg_wellbeing DECIMAL,
    avg_stress DECIMAL,
    avg_sleep_quality DECIMAL
) AS $$
DECLARE
    v_week_end DATE := p_week_start + INTERVAL '6 days';
BEGIN
    -- Nutrition Compliance
    SELECT
        ROUND((COUNT(*) FILTER (WHERE plan_followed = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2)
    INTO nutrition_compliance
    FROM nutrition_compliance nc
    WHERE nc.user_id = p_user_id
    AND nc.date BETWEEN p_week_start AND v_week_end;

    -- Training Compliance (vs geplant)
    SELECT
        ROUND((COUNT(*)::DECIMAL / NULLIF(7, 0)) * 100, 2)
    INTO training_compliance
    FROM training_sessions ts
    WHERE ts.user_id = p_user_id
    AND ts.date BETWEEN p_week_start AND v_week_end;

    -- Supplement Compliance
    SELECT
        ROUND((COUNT(*) FILTER (WHERE taken = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2)
    INTO supplement_compliance
    FROM supplement_compliance sc
    WHERE sc.user_id = p_user_id
    AND sc.date BETWEEN p_week_start AND v_week_end;

    -- Wellbeing/Stress/Sleep from daily_logs
    SELECT
        ROUND(AVG(mood), 2),
        ROUND(AVG(stress_level), 2),
        ROUND(AVG(sleep_duration), 2)
    INTO avg_wellbeing, avg_stress, avg_sleep_quality
    FROM daily_logs dl
    WHERE dl.user_id = p_user_id
    AND dl.date BETWEEN p_week_start AND v_week_end;

    RETURN QUERY SELECT
        nutrition_compliance,
        training_compliance,
        supplement_compliance,
        avg_wellbeing,
        avg_stress,
        avg_sleep_quality;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE body_tracking IS 'Daily body metrics: weight, measurements, vitals';
COMMENT ON TABLE progress_photos IS 'Weekly progress photos (4 angles)';
COMMENT ON TABLE nutrition_compliance IS 'Daily nutrition plan compliance tracking';
COMMENT ON TABLE training_sessions IS 'Training session logs';
COMMENT ON TABLE training_sets IS 'Individual set data for exercises';
COMMENT ON TABLE cardio_sessions IS 'Cardio session tracking';
COMMENT ON TABLE supplement_compliance IS 'Daily supplement intake tracking';
COMMENT ON TABLE weekly_updates IS 'Weekly summary reports for coach';
