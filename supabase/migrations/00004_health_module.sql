-- ═══════════════════════════════════════════════════════════════
-- Life OS - Health Module Schema
-- Migration: 00004_health_module.sql
-- ═══════════════════════════════════════════════════════════════
-- Habits, Nutrition, Supplements, Garmin, Training, Readiness
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. HABITS (Gewohnheiten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- gesundheit, fitness, ernaehrung, supplements, produktivitaet, finanzen, beziehungen
    frequency VARCHAR(20), -- daily, weekly, monthly
    target_value DECIMAL(10,2), -- z.B. 180 für 180g Protein
    unit VARCHAR(50), -- g, mg, ml, min, count
    target_days JSONB, -- [1,2,3,4,5] = Mo-Fr (1=Mo, 7=So)
    reminder_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('habits');

-- ───────────────────────────────────────────────────────────────
-- 2. HABIT_LOGS (Habit-Einträge)
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

-- ───────────────────────────────────────────────────────────────
-- 3. DAILY_NUTRITION (Tägliche Makros)
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

-- ───────────────────────────────────────────────────────────────
-- 4. SUPPLEMENTS (Supplement-Stammdaten)
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

-- ───────────────────────────────────────────────────────────────
-- 5. SUPPLEMENT_LOGS (Einnahme-Protokoll)
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

-- ───────────────────────────────────────────────────────────────
-- 6. SUPPLEMENT_CYCLES (Zyklen für Peptide/PEDs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE supplement_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    supplements JSONB, -- Array von Supplement-IDs mit Dosierungen
    start_date DATE,
    end_date DATE,
    status VARCHAR(20), -- planned, active, completed
    protocol JSONB, -- Detaillierter Plan
    notes TEXT,
    results TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('supplement_cycles');

-- ───────────────────────────────────────────────────────────────
-- 7. GARMIN_DAILY_STATS (Garmin-Daten)
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

-- ───────────────────────────────────────────────────────────────
-- 8. TRAINING_PLANS (Trainingspläne)
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

-- ───────────────────────────────────────────────────────────────
-- 9. TRAINING_PLAN_DAYS (Trainingstage)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE training_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 1-7 (1=Mo)
    name VARCHAR(100), -- "Push Day", "Legs"
    focus_areas JSONB, -- ["brust", "schultern", "trizeps"]
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 10. EXERCISES (Übungs-Stammdaten)
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

-- ───────────────────────────────────────────────────────────────
-- 11. WORKOUTS (Tatsächliche Trainingseinheiten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    plan_day_id UUID REFERENCES training_plan_days(id) ON DELETE SET NULL,
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
    perceived_exertion INTEGER, -- 1-10 (RPE)
    energy_level_before INTEGER, -- 1-10
    mood_after INTEGER, -- 1-10
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 12. WORKOUT_SETS (Tatsächliche Sätze)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER,
    weight DECIMAL(6,2),
    reps INTEGER,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_pr BOOLEAN DEFAULT FALSE, -- Personal Record
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 13. DAILY_READINESS (Trainingsbereitschaft)
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

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Funktion: calculate_readiness_score
-- Berechnet den Readiness Score basierend auf Garmin-Daten
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_readiness_score(target_date DATE)
RETURNS TABLE (
    readiness_score INTEGER,
    recommendation VARCHAR(50),
    factors JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_sleep_score INTEGER;
    v_hrv_status VARCHAR(20);
    v_body_battery INTEGER;
    v_stress_avg INTEGER;
    v_prev_workout_intensity INTEGER;
    v_score INTEGER := 0;
    v_factors JSONB;
    v_recommendation VARCHAR(50);
BEGIN
    -- Garmin Daten für den Tag holen
    SELECT
        g.sleep_score,
        g.hrv_status,
        g.body_battery_start,
        g.stress_avg
    INTO
        v_sleep_score,
        v_hrv_status,
        v_body_battery,
        v_stress_avg
    FROM garmin_daily_stats g
    WHERE g.date = target_date;

    -- Wenn keine Garmin-Daten vorhanden, NULL zurückgeben
    IF v_sleep_score IS NULL AND v_body_battery IS NULL THEN
        RETURN QUERY SELECT NULL::INTEGER, NULL::VARCHAR(50), NULL::JSONB;
        RETURN;
    END IF;

    -- Vorheriges Workout holen (Intensity = RPE)
    SELECT w.perceived_exertion
    INTO v_prev_workout_intensity
    FROM workouts w
    WHERE w.date = target_date - 1
    ORDER BY w.created_at DESC
    LIMIT 1;

    -- Score berechnen (max 100)

    -- Sleep Score (max 30 Punkte)
    IF v_sleep_score IS NOT NULL THEN
        v_score := v_score + LEAST(30, v_sleep_score * 0.3);
    END IF;

    -- HRV Status (max 20 Punkte)
    IF v_hrv_status = 'balanced' THEN
        v_score := v_score + 20;
    ELSIF v_hrv_status = 'high' THEN
        v_score := v_score + 15;
    ELSIF v_hrv_status = 'low' THEN
        v_score := v_score + 5;
    END IF;

    -- Body Battery (max 25 Punkte)
    IF v_body_battery IS NOT NULL THEN
        v_score := v_score + LEAST(25, v_body_battery * 0.25);
    END IF;

    -- Stress (max 15 Punkte) - niedriger ist besser
    IF v_stress_avg IS NOT NULL THEN
        v_score := v_score + GREATEST(0, 15 - (v_stress_avg * 0.15));
    END IF;

    -- Recovery von gestern (max 10 Punkte)
    IF v_prev_workout_intensity IS NULL THEN
        v_score := v_score + 10; -- Kein Training = volle Erholung
    ELSIF v_prev_workout_intensity <= 5 THEN
        v_score := v_score + 8;
    ELSIF v_prev_workout_intensity <= 7 THEN
        v_score := v_score + 5;
    ELSE
        v_score := v_score + 2; -- Hartes Training gestern
    END IF;

    -- Score runden
    v_score := ROUND(v_score);

    -- Empfehlung basierend auf Score
    IF v_score >= 80 THEN
        v_recommendation := 'full_intensity';
    ELSIF v_score >= 60 THEN
        v_recommendation := 'moderate';
    ELSIF v_score >= 40 THEN
        v_recommendation := 'light_only';
    ELSE
        v_recommendation := 'rest_day';
    END IF;

    -- Faktoren zusammenstellen
    v_factors := jsonb_build_object(
        'sleep_score', v_sleep_score,
        'hrv_status', v_hrv_status,
        'body_battery', v_body_battery,
        'stress_avg', v_stress_avg,
        'previous_workout_intensity', v_prev_workout_intensity
    );

    RETURN QUERY SELECT v_score, v_recommendation, v_factors;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- Funktion: get_habit_streak
-- Berechnet die aktuelle Streak für ein Habit
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_habit_streak(p_habit_id UUID)
RETURNS TABLE (
    current_streak INTEGER,
    longest_streak INTEGER,
    last_completed DATE,
    completion_rate_30d DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_temp_streak INTEGER := 0;
    v_last_date DATE;
    v_expected_date DATE;
    v_habit_frequency VARCHAR(20);
    v_target_days JSONB;
    rec RECORD;
BEGIN
    -- Habit-Frequenz holen
    SELECT h.frequency, h.target_days
    INTO v_habit_frequency, v_target_days
    FROM habits h
    WHERE h.id = p_habit_id;

    -- Current Streak berechnen (rückwärts von heute)
    v_expected_date := CURRENT_DATE;

    FOR rec IN
        SELECT hl.date, hl.is_completed
        FROM habit_logs hl
        WHERE hl.habit_id = p_habit_id
          AND hl.is_completed = true
        ORDER BY hl.date DESC
    LOOP
        -- Für daily habits: jeden Tag prüfen
        IF v_habit_frequency = 'daily' THEN
            -- Prüfen ob target_days definiert sind
            IF v_target_days IS NOT NULL THEN
                -- Skip Tage die nicht in target_days sind
                WHILE NOT (EXTRACT(ISODOW FROM v_expected_date)::INTEGER = ANY(
                    SELECT jsonb_array_elements_text(v_target_days)::INTEGER
                )) AND v_expected_date >= rec.date LOOP
                    v_expected_date := v_expected_date - 1;
                END LOOP;
            END IF;

            IF rec.date = v_expected_date THEN
                v_current_streak := v_current_streak + 1;
                v_expected_date := v_expected_date - 1;
            ELSE
                EXIT; -- Streak unterbrochen
            END IF;
        ELSIF v_habit_frequency = 'weekly' THEN
            -- Für wöchentliche Habits: innerhalb der letzten 7 Tage
            IF rec.date >= v_expected_date - 7 THEN
                v_current_streak := v_current_streak + 1;
                v_expected_date := rec.date - 1;
            ELSE
                EXIT;
            END IF;
        END IF;
    END LOOP;

    -- Longest Streak berechnen
    v_temp_streak := 0;
    v_last_date := NULL;

    FOR rec IN
        SELECT hl.date
        FROM habit_logs hl
        WHERE hl.habit_id = p_habit_id
          AND hl.is_completed = true
        ORDER BY hl.date ASC
    LOOP
        IF v_last_date IS NULL OR
           (v_habit_frequency = 'daily' AND rec.date = v_last_date + 1) OR
           (v_habit_frequency = 'weekly' AND rec.date <= v_last_date + 7) THEN
            v_temp_streak := v_temp_streak + 1;
        ELSE
            v_temp_streak := 1;
        END IF;

        IF v_temp_streak > v_longest_streak THEN
            v_longest_streak := v_temp_streak;
        END IF;

        v_last_date := rec.date;
    END LOOP;

    -- Return values
    RETURN QUERY
    SELECT
        v_current_streak,
        v_longest_streak,
        (SELECT MAX(hl.date) FROM habit_logs hl WHERE hl.habit_id = p_habit_id AND hl.is_completed = true),
        (
            SELECT ROUND(
                COUNT(CASE WHEN hl.is_completed THEN 1 END)::DECIMAL /
                NULLIF(COUNT(*), 0) * 100, 2
            )
            FROM habit_logs hl
            WHERE hl.habit_id = p_habit_id
              AND hl.date >= CURRENT_DATE - 30
        );
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- Funktion: Auto-Calculate and Store Readiness
-- Wird von n8n täglich aufgerufen
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_daily_readiness(target_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_result RECORD;
    v_garmin RECORD;
BEGIN
    -- Garmin Daten holen
    SELECT * INTO v_garmin
    FROM garmin_daily_stats
    WHERE date = target_date;

    IF v_garmin.id IS NULL THEN
        RETURN; -- Keine Daten, nichts tun
    END IF;

    -- Readiness berechnen
    SELECT * INTO v_result
    FROM calculate_readiness_score(target_date);

    -- In daily_readiness speichern/updaten
    INSERT INTO daily_readiness (
        date,
        sleep_score,
        hrv_status,
        body_battery,
        stress_avg,
        previous_workout_intensity,
        readiness_score,
        recommendation
    )
    VALUES (
        target_date,
        v_garmin.sleep_score,
        v_garmin.hrv_status,
        v_garmin.body_battery_start,
        v_garmin.stress_avg,
        (v_result.factors->>'previous_workout_intensity')::INTEGER,
        v_result.readiness_score,
        v_result.recommendation
    )
    ON CONFLICT (date) DO UPDATE SET
        sleep_score = EXCLUDED.sleep_score,
        hrv_status = EXCLUDED.hrv_status,
        body_battery = EXCLUDED.body_battery,
        stress_avg = EXCLUDED.stress_avg,
        previous_workout_intensity = EXCLUDED.previous_workout_intensity,
        readiness_score = EXCLUDED.readiness_score,
        recommendation = EXCLUDED.recommendation;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- INDIZES
-- ═══════════════════════════════════════════════════════════════

-- Habits
CREATE INDEX idx_habits_category ON habits(category);
CREATE INDEX idx_habits_active ON habits(is_active) WHERE is_active = true;
CREATE INDEX idx_habits_frequency ON habits(frequency);
CREATE INDEX idx_habits_sort ON habits(sort_order);

-- Habit Logs
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(date DESC);
CREATE INDEX idx_habit_logs_completed ON habit_logs(habit_id, date) WHERE is_completed = true;
CREATE INDEX idx_habit_logs_recent ON habit_logs(date DESC, habit_id);

-- Daily Nutrition
CREATE INDEX idx_daily_nutrition_date ON daily_nutrition(date DESC);

-- Supplements
CREATE INDEX idx_supplements_category ON supplements(category);
CREATE INDEX idx_supplements_active ON supplements(is_active) WHERE is_active = true;
CREATE INDEX idx_supplements_low_stock ON supplements(current_stock, reorder_threshold)
    WHERE is_active = true AND current_stock <= reorder_threshold;

-- Supplement Logs
CREATE INDEX idx_supplement_logs_supplement ON supplement_logs(supplement_id);
CREATE INDEX idx_supplement_logs_date ON supplement_logs(date DESC);
CREATE INDEX idx_supplement_logs_taken ON supplement_logs(date, supplement_id) WHERE is_taken = true;

-- Supplement Cycles
CREATE INDEX idx_supplement_cycles_status ON supplement_cycles(status);
CREATE INDEX idx_supplement_cycles_active ON supplement_cycles(start_date, end_date) WHERE status = 'active';

-- Garmin Daily Stats
CREATE INDEX idx_garmin_daily_stats_date ON garmin_daily_stats(date DESC);
CREATE INDEX idx_garmin_daily_stats_sleep ON garmin_daily_stats(date, sleep_score);
CREATE INDEX idx_garmin_daily_stats_stress ON garmin_daily_stats(date, stress_avg);

-- Training Plans
CREATE INDEX idx_training_plans_active ON training_plans(is_active) WHERE is_active = true;

-- Training Plan Days
CREATE INDEX idx_training_plan_days_plan ON training_plan_days(plan_id);
CREATE INDEX idx_training_plan_days_dow ON training_plan_days(day_of_week);

-- Exercises
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_name ON exercises USING gin(name gin_trgm_ops);

-- Workouts
CREATE INDEX idx_workouts_date ON workouts(date DESC);
CREATE INDEX idx_workouts_plan_day ON workouts(plan_day_id) WHERE plan_day_id IS NOT NULL;
CREATE INDEX idx_workouts_type ON workouts(type);
CREATE INDEX idx_workouts_garmin ON workouts(garmin_activity_id) WHERE garmin_activity_id IS NOT NULL;

-- Workout Sets
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX idx_workout_sets_pr ON workout_sets(exercise_id) WHERE is_pr = true;

-- Daily Readiness
CREATE INDEX idx_daily_readiness_date ON daily_readiness(date DESC);
CREATE INDEX idx_daily_readiness_recommendation ON daily_readiness(recommendation);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
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

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Authenticated Users
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Authenticated users can manage habits"
ON habits FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage habit_logs"
ON habit_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage daily_nutrition"
ON daily_nutrition FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage supplements"
ON supplements FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage supplement_logs"
ON supplement_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage supplement_cycles"
ON supplement_cycles FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage garmin_daily_stats"
ON garmin_daily_stats FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage training_plans"
ON training_plans FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage training_plan_days"
ON training_plan_days FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage exercises"
ON exercises FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage workouts"
ON workouts FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage workout_sets"
ON workout_sets FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage daily_readiness"
ON daily_readiness FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Service Role (für n8n Workflows)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Service role has full access to habits"
ON habits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to habit_logs"
ON habit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to daily_nutrition"
ON daily_nutrition FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to supplements"
ON supplements FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to supplement_logs"
ON supplement_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to supplement_cycles"
ON supplement_cycles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to garmin_daily_stats"
ON garmin_daily_stats FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to training_plans"
ON training_plans FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to training_plan_days"
ON training_plan_days FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to exercises"
ON exercises FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workouts"
ON workouts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workout_sets"
ON workout_sets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to daily_readiness"
ON daily_readiness FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View: Heutige Habits
CREATE VIEW v_today_habits AS
SELECT
    h.id,
    h.name,
    h.category,
    h.target_value,
    h.unit,
    h.reminder_time,
    h.sort_order,
    hl.is_completed,
    hl.value AS logged_value,
    hl.notes AS log_notes,
    (SELECT current_streak FROM get_habit_streak(h.id)) AS current_streak
FROM habits h
LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = CURRENT_DATE
WHERE h.is_active = true
  AND (
      h.target_days IS NULL
      OR EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER = ANY(
          SELECT jsonb_array_elements_text(h.target_days)::INTEGER
      )
  )
ORDER BY h.sort_order NULLS LAST, h.name;

-- View: Habit Completion Matrix (letzte 7 Tage)
CREATE VIEW v_habit_week_matrix AS
SELECT
    h.id AS habit_id,
    h.name,
    h.category,
    d.date,
    COALESCE(hl.is_completed, false) AS is_completed,
    hl.value
FROM habits h
CROSS JOIN generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::INTERVAL) AS d(date)
LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = d.date::DATE
WHERE h.is_active = true
ORDER BY h.sort_order NULLS LAST, d.date;

-- View: Supplement Status
CREATE VIEW v_supplement_status AS
SELECT
    s.id,
    s.name,
    s.brand,
    s.category,
    s.dosage_amount,
    s.dosage_unit,
    s.timing,
    s.current_stock,
    s.reorder_threshold,
    s.cost_per_unit,
    -- Heute schon eingenommen?
    EXISTS (
        SELECT 1 FROM supplement_logs sl
        WHERE sl.supplement_id = s.id
          AND sl.date = CURRENT_DATE
          AND sl.is_taken = true
    ) AS taken_today,
    -- Stock Status
    CASE
        WHEN s.current_stock <= 0 THEN 'out_of_stock'
        WHEN s.current_stock <= s.reorder_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END AS stock_status
FROM supplements s
WHERE s.is_active = true
ORDER BY s.timing, s.name;

-- View: Garmin Weekly Summary
CREATE VIEW v_garmin_week_summary AS
SELECT
    AVG(sleep_score)::INTEGER AS avg_sleep_score,
    AVG(sleep_duration_minutes)::INTEGER AS avg_sleep_minutes,
    AVG(body_battery_start)::INTEGER AS avg_body_battery,
    AVG(stress_avg)::INTEGER AS avg_stress,
    AVG(steps)::INTEGER AS avg_steps,
    SUM(intensity_minutes)::INTEGER AS total_intensity_minutes,
    AVG(resting_hr)::INTEGER AS avg_resting_hr,
    COUNT(*) AS days_tracked
FROM garmin_daily_stats
WHERE date >= CURRENT_DATE - 7;

-- View: Workout History
CREATE VIEW v_workout_history AS
SELECT
    w.id,
    w.date,
    w.type,
    w.duration_minutes,
    w.location,
    tpd.name AS planned_workout,
    w.avg_hr,
    w.max_hr,
    w.calories_burned,
    w.perceived_exertion,
    w.energy_level_before,
    w.mood_after,
    COUNT(ws.id) AS total_sets,
    SUM(CASE WHEN ws.is_pr THEN 1 ELSE 0 END) AS pr_count
FROM workouts w
LEFT JOIN training_plan_days tpd ON tpd.id = w.plan_day_id
LEFT JOIN workout_sets ws ON ws.workout_id = w.id
GROUP BY w.id, w.date, w.type, w.duration_minutes, w.location, tpd.name,
         w.avg_hr, w.max_hr, w.calories_burned, w.perceived_exertion,
         w.energy_level_before, w.mood_after
ORDER BY w.date DESC;

-- View: Exercise Progress (PRs)
CREATE VIEW v_exercise_progress AS
SELECT
    e.id AS exercise_id,
    e.name AS exercise_name,
    e.muscle_group,
    MAX(ws.weight) AS max_weight,
    MAX(ws.reps) FILTER (WHERE ws.weight = (
        SELECT MAX(weight) FROM workout_sets WHERE exercise_id = e.id
    )) AS reps_at_max_weight,
    (
        SELECT ws2.weight
        FROM workout_sets ws2
        JOIN workouts w2 ON w2.id = ws2.workout_id
        WHERE ws2.exercise_id = e.id AND ws2.is_pr = true
        ORDER BY w2.date DESC
        LIMIT 1
    ) AS latest_pr_weight,
    (
        SELECT w2.date
        FROM workout_sets ws2
        JOIN workouts w2 ON w2.id = ws2.workout_id
        WHERE ws2.exercise_id = e.id AND ws2.is_pr = true
        ORDER BY w2.date DESC
        LIMIT 1
    ) AS latest_pr_date,
    COUNT(DISTINCT w.id) AS workout_count
FROM exercises e
LEFT JOIN workout_sets ws ON ws.exercise_id = e.id
LEFT JOIN workouts w ON w.id = ws.workout_id
GROUP BY e.id, e.name, e.muscle_group;

-- View: Daily Health Dashboard
CREATE VIEW v_daily_health_dashboard AS
SELECT
    CURRENT_DATE AS date,
    -- Garmin
    g.sleep_score,
    g.body_battery_start AS body_battery,
    g.stress_avg,
    g.steps,
    g.resting_hr,
    g.hrv_status,
    -- Readiness
    dr.readiness_score,
    dr.recommendation,
    -- Nutrition
    dn.calories,
    dn.protein_g,
    -- Habits
    (SELECT COUNT(*) FROM habits WHERE is_active = true) AS total_habits,
    (SELECT COUNT(*) FROM habit_logs WHERE date = CURRENT_DATE AND is_completed = true) AS completed_habits,
    -- Supplements
    (SELECT COUNT(*) FROM supplements WHERE is_active = true) AS total_supplements,
    (SELECT COUNT(DISTINCT supplement_id) FROM supplement_logs WHERE date = CURRENT_DATE AND is_taken = true) AS taken_supplements,
    -- Workout
    (SELECT COUNT(*) FROM workouts WHERE date = CURRENT_DATE) AS workouts_today
FROM (SELECT 1) AS dummy
LEFT JOIN garmin_daily_stats g ON g.date = CURRENT_DATE
LEFT JOIN daily_readiness dr ON dr.date = CURRENT_DATE
LEFT JOIN daily_nutrition dn ON dn.date = CURRENT_DATE;

-- ═══════════════════════════════════════════════════════════════
-- Ende Health Module Schema
-- ═══════════════════════════════════════════════════════════════
