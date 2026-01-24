-- ═══════════════════════════════════════════════════════════════
-- Life OS - Health Module Schema
-- Migration: 00004_health_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Habits (Gewohnheiten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- gesundheit, fitness, ernaehrung, supplements, produktivitaet, finanzen, beziehungen
    frequency VARCHAR(20), -- daily, weekly, monthly
    target_value DECIMAL(10,2),
    unit VARCHAR(50),
    target_days JSONB, -- [1,2,3,4,5] = Mo-Fr
    reminder_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('habits');
CREATE INDEX idx_habits_category ON habits(category);
CREATE INDEX idx_habits_active ON habits(is_active);

-- ───────────────────────────────────────────────────────────────
-- Habit Logs (Habit-Einträge)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(10,2),
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(date);

-- ───────────────────────────────────────────────────────────────
-- Daily Nutrition (Tägliche Makros)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE daily_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    calories INTEGER,
    protein_g DECIMAL(6,1),
    carbs_g DECIMAL(6,1),
    fat_g DECIMAL(6,1),
    fiber_g DECIMAL(6,1),
    water_ml INTEGER,
    source VARCHAR(50), -- manual, myfitnesspal, cronometer
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_nutrition_date ON daily_nutrition(date);

-- ───────────────────────────────────────────────────────────────
-- Supplements (Supplement-Stammdaten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(50), -- vitamin, mineral, aminosaeure, hormon, peptid, ped, nootropic, sonstiges
    dosage_amount DECIMAL(10,2),
    dosage_unit VARCHAR(20),
    frequency VARCHAR(20), -- daily, weekly, cycling
    timing VARCHAR(50), -- morgens, mittags, abends, pre_workout, post_workout
    cycle_on_days INTEGER,
    cycle_off_days INTEGER,
    current_stock DECIMAL(10,2),
    reorder_threshold DECIMAL(10,2),
    supplier VARCHAR(255),
    cost_per_unit DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    warnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('supplements');
CREATE INDEX idx_supplements_category ON supplements(category);
CREATE INDEX idx_supplements_active ON supplements(is_active);

-- ───────────────────────────────────────────────────────────────
-- Supplement Logs (Einnahme-Protokoll)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME,
    dosage_taken DECIMAL(10,2),
    is_taken BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplement_logs_supplement ON supplement_logs(supplement_id);
CREATE INDEX idx_supplement_logs_date ON supplement_logs(date);

-- ───────────────────────────────────────────────────────────────
-- Supplement Cycles (Zyklen für Peptide/PEDs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE supplement_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    supplements JSONB, -- Array von Supplement-IDs
    start_date DATE,
    end_date DATE,
    status VARCHAR(20), -- planned, active, completed
    protocol JSONB,
    notes TEXT,
    results TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('supplement_cycles');
CREATE INDEX idx_supplement_cycles_status ON supplement_cycles(status);

-- ───────────────────────────────────────────────────────────────
-- Garmin Daily Stats (Garmin-Daten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE garmin_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    -- Schlaf
    sleep_score INTEGER,
    sleep_duration_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    awake_minutes INTEGER,

    -- Energie & Stress
    body_battery_start INTEGER,
    body_battery_end INTEGER,
    body_battery_charged INTEGER,
    body_battery_drained INTEGER,
    stress_avg INTEGER,
    stress_max INTEGER,
    rest_stress_minutes INTEGER,
    low_stress_minutes INTEGER,
    medium_stress_minutes INTEGER,
    high_stress_minutes INTEGER,

    -- Aktivität
    steps INTEGER,
    active_calories INTEGER,
    total_calories INTEGER,
    intensity_minutes INTEGER,
    floors_climbed INTEGER,

    -- HRV & Herzfrequenz
    resting_hr INTEGER,
    hrv_status VARCHAR(20), -- balanced, low, high
    hrv_value INTEGER,

    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garmin_daily_stats_date ON garmin_daily_stats(date);

-- ───────────────────────────────────────────────────────────────
-- Training Plans (Trainingspläne)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- kraft, ausdauer, mobility, hybrid
    days_per_week INTEGER,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('training_plans');
CREATE INDEX idx_training_plans_active ON training_plans(is_active);

-- ───────────────────────────────────────────────────────────────
-- Training Plan Days (Trainingstage)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE training_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 1-7
    name VARCHAR(100),
    focus_areas JSONB,
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_plan_days_plan ON training_plan_days(plan_id);

-- ───────────────────────────────────────────────────────────────
-- Exercises (Übungs-Stammdaten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    muscle_group VARCHAR(100),
    equipment_needed VARCHAR(255),
    instructions TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

-- ───────────────────────────────────────────────────────────────
-- Workouts (Tatsächliche Trainingseinheiten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    plan_day_id UUID REFERENCES training_plan_days(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    type VARCHAR(50),
    location VARCHAR(50), -- gym, home, outdoor

    -- Garmin-Daten
    garmin_activity_id VARCHAR(100),
    avg_hr INTEGER,
    max_hr INTEGER,
    calories_burned INTEGER,

    -- Subjektiv
    perceived_exertion INTEGER, -- 1-10
    energy_level_before INTEGER, -- 1-10
    mood_after INTEGER, -- 1-10
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_plan_day ON workouts(plan_day_id);

-- ───────────────────────────────────────────────────────────────
-- Workout Sets (Tatsächliche Sätze)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    set_number INTEGER,
    weight DECIMAL(6,2),
    reps INTEGER,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_pr BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);

-- ───────────────────────────────────────────────────────────────
-- Daily Readiness (Trainingsbereitschaft)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE daily_readiness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    sleep_score INTEGER,
    hrv_status VARCHAR(20),
    body_battery INTEGER,
    stress_avg INTEGER,
    previous_workout_intensity INTEGER,
    readiness_score INTEGER, -- 0-100
    recommendation VARCHAR(50), -- full_intensity, moderate, light_only, rest_day
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_readiness_date ON daily_readiness(date);

-- ───────────────────────────────────────────────────────────────
-- Body Measurements (Körpermessungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    body_fat_percent DECIMAL(4,1),
    muscle_mass_kg DECIMAL(5,2),
    water_percent DECIMAL(4,1),
    bone_mass_kg DECIMAL(4,2),
    visceral_fat INTEGER,
    bmr INTEGER,
    metabolic_age INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_body_measurements_date ON body_measurements(date);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE garmin_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON habits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON habit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON daily_nutrition FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON supplements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON supplement_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON supplement_cycles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON garmin_daily_stats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON training_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON training_plan_days FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON exercises FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON workouts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON workout_sets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON daily_readiness FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON body_measurements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
CREATE POLICY "Authenticated read access" ON habits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON habit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON daily_nutrition FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON supplements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON supplement_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON supplement_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON garmin_daily_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON training_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON training_plan_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON workouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON workout_sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON daily_readiness FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON body_measurements FOR SELECT TO authenticated USING (true);

-- ───────────────────────────────────────────────────────────────
-- Helper Functions
-- ───────────────────────────────────────────────────────────────

-- Calculate readiness score
CREATE OR REPLACE FUNCTION calculate_readiness_score(
    p_sleep_score INTEGER,
    p_hrv_status VARCHAR,
    p_body_battery INTEGER,
    p_stress_avg INTEGER,
    p_previous_workout_intensity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    hrv_score INTEGER := 0;
BEGIN
    -- Sleep score contribution (max 30 points)
    score := score + LEAST(COALESCE(p_sleep_score, 50) * 0.3, 30);

    -- HRV status contribution (max 20 points)
    hrv_score := CASE p_hrv_status
        WHEN 'balanced' THEN 20
        WHEN 'high' THEN 15
        WHEN 'low' THEN 5
        ELSE 10
    END;
    score := score + hrv_score;

    -- Body battery contribution (max 25 points)
    score := score + LEAST(COALESCE(p_body_battery, 50) * 0.25, 25);

    -- Stress contribution (max 15 points, lower is better)
    score := score + GREATEST(15 - (COALESCE(p_stress_avg, 30) * 0.15), 0);

    -- Previous workout recovery (max 10 points)
    score := score + GREATEST(10 - COALESCE(p_previous_workout_intensity, 5), 0);

    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Get readiness recommendation
CREATE OR REPLACE FUNCTION get_readiness_recommendation(score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN score >= 80 THEN 'full_intensity'
        WHEN score >= 60 THEN 'moderate'
        WHEN score >= 40 THEN 'light_only'
        ELSE 'rest_day'
    END;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Ende Health Schema
-- ═══════════════════════════════════════════════════════════════
