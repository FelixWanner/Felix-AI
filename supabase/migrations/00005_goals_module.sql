-- ═══════════════════════════════════════════════════════════════
-- Life OS - Goals Module Schema
-- Migration: 00005_goals_module.sql
-- ═══════════════════════════════════════════════════════════════
-- Goals, OKRs, Daily Logs, Weekly Reviews
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. GOALS (Ziele & OKRs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    timeframe VARCHAR(20) NOT NULL, -- year, quarter, month, week, day
    parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    area VARCHAR(50), -- wealth, health, career, relationships, personal_growth, lifestyle

    start_date DATE,
    end_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    week INTEGER,

    -- Messbarkeit
    target_type VARCHAR(20), -- boolean, numeric, milestone
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),

    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed, failed, deferred
    priority INTEGER, -- 1-4

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

SELECT create_updated_at_trigger('goals');

-- Jetzt FK für inbox_items.goal_id hinzufügen (aus Productivity Module)
ALTER TABLE inbox_items ADD CONSTRAINT fk_inbox_items_goal
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- 2. GOAL_KEY_RESULTS (Key Results für OKRs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE goal_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('goal_key_results');

-- ───────────────────────────────────────────────────────────────
-- 3. GOAL_CHECKINS (Reviews & Updates)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE goal_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    progress_update TEXT,
    blockers TEXT,
    next_actions TEXT,
    confidence_level INTEGER, -- 1-10
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 4. DAILY_LOGS (Tagesrückblick)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    -- Morgen-Routine
    morning_mood INTEGER, -- 1-10
    morning_energy INTEGER, -- 1-10
    morning_intention TEXT,
    top_3_priorities JSONB, -- ["task1", "task2", "task3"]

    -- Abend-Reflexion
    evening_mood INTEGER, -- 1-10
    evening_energy INTEGER, -- 1-10
    wins JSONB, -- ["win1", "win2", ...]
    lessons JSONB, -- ["lesson1", ...]
    gratitude JSONB, -- ["item1", "item2", "item3"]
    tomorrow_focus TEXT,

    -- Aggregierte Daten (automatisch gefüllt)
    tasks_completed_count INTEGER,
    tasks_total_count INTEGER,
    billable_hours DECIMAL(4,1),
    meetings_count INTEGER,
    habits_completed_percent DECIMAL(5,2),

    -- Verknüpfungen
    garmin_stats_id UUID REFERENCES garmin_daily_stats(id) ON DELETE SET NULL,
    nutrition_id UUID REFERENCES daily_nutrition(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('daily_logs');

-- ───────────────────────────────────────────────────────────────
-- 5. WEEKLY_REVIEWS (Wochenrückblick)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,

    -- Auto-Metriken (von n8n berechnet)
    tasks_completed INTEGER,
    tasks_created INTEGER,
    tasks_overdue INTEGER,
    meetings_count INTEGER,
    meetings_hours DECIMAL(5,1),
    billable_hours DECIMAL(5,1),
    billable_revenue DECIMAL(10,2),
    focus_sessions_count INTEGER,
    focus_hours_total DECIMAL(5,1),
    inbox_processed INTEGER,
    inbox_remaining INTEGER,

    -- Goals
    weekly_goals_completed JSONB, -- [{goal_id, title}]
    weekly_goals_missed JSONB,

    -- Health
    avg_sleep_score DECIMAL(5,1),
    avg_stress DECIMAL(5,1),
    workouts_completed INTEGER,
    workouts_planned INTEGER,
    habits_completion_rate DECIMAL(5,2),

    -- Reflexion (manuell)
    wins JSONB, -- ["win1", "win2", ...]
    challenges JSONB,
    lessons_learned TEXT,
    next_week_focus TEXT,
    overall_rating INTEGER, -- 1-10

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number)
);

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Funktion: Update Goal Progress
-- Berechnet Progress basierend auf Key Results oder direkt
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_goal_progress(p_goal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_type VARCHAR(20);
    v_target_value DECIMAL(14,2);
    v_current_value DECIMAL(14,2);
    v_progress DECIMAL(5,2);
    v_kr_count INTEGER;
    v_kr_progress DECIMAL(5,2);
BEGIN
    -- Goal-Daten holen
    SELECT target_type, target_value, current_value
    INTO v_target_type, v_target_value, v_current_value
    FROM goals
    WHERE id = p_goal_id;

    -- Prüfen ob Key Results existieren
    SELECT COUNT(*), COALESCE(AVG(progress_percent), 0)
    INTO v_kr_count, v_kr_progress
    FROM goal_key_results
    WHERE goal_id = p_goal_id;

    IF v_kr_count > 0 THEN
        -- Progress = Durchschnitt der Key Results
        v_progress := v_kr_progress;
    ELSIF v_target_type = 'numeric' AND v_target_value > 0 THEN
        -- Progress = current / target * 100
        v_progress := LEAST(100, (COALESCE(v_current_value, 0) / v_target_value) * 100);
    ELSIF v_target_type = 'boolean' THEN
        -- Progress = 0 oder 100
        v_progress := CASE WHEN COALESCE(v_current_value, 0) >= 1 THEN 100 ELSE 0 END;
    ELSE
        v_progress := 0;
    END IF;

    -- Goal updaten
    UPDATE goals
    SET progress_percent = v_progress,
        status = CASE
            WHEN v_progress >= 100 THEN 'completed'
            WHEN v_progress > 0 THEN 'in_progress'
            ELSE status
        END,
        completed_at = CASE
            WHEN v_progress >= 100 AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END
    WHERE id = p_goal_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- Trigger: Auto-Update Goal Progress when Key Result changes
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Key Result Progress berechnen
    IF NEW.target_value > 0 THEN
        NEW.progress_percent := LEAST(100, (COALESCE(NEW.current_value, 0) / NEW.target_value) * 100);
    END IF;

    -- Status updaten
    IF NEW.progress_percent >= 100 THEN
        NEW.status := 'completed';
    ELSIF NEW.progress_percent > 0 THEN
        NEW.status := 'in_progress';
    END IF;

    -- Parent Goal Progress updaten
    PERFORM update_goal_progress(NEW.goal_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_key_result_progress
BEFORE INSERT OR UPDATE ON goal_key_results
FOR EACH ROW
EXECUTE FUNCTION trigger_update_goal_progress();

-- ───────────────────────────────────────────────────────────────
-- Funktion: Get Goal Hierarchy
-- Gibt alle Child-Goals eines Goals zurück
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_goal_children(p_goal_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    timeframe VARCHAR(20),
    progress_percent DECIMAL(5,2),
    status VARCHAR(50),
    depth INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE goal_tree AS (
        -- Basis: direktes Kind
        SELECT
            g.id,
            g.title,
            g.timeframe,
            g.progress_percent,
            g.status,
            1 AS depth
        FROM goals g
        WHERE g.parent_goal_id = p_goal_id

        UNION ALL

        -- Rekursiv: Kinder der Kinder
        SELECT
            g.id,
            g.title,
            g.timeframe,
            g.progress_percent,
            g.status,
            gt.depth + 1
        FROM goals g
        JOIN goal_tree gt ON g.parent_goal_id = gt.id
    )
    SELECT * FROM goal_tree
    ORDER BY depth, title;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- Funktion: Auto-Fill Daily Log Stats
-- Wird von n8n aufgerufen um aggregierte Daten zu füllen
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fill_daily_log_stats(target_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_tasks_completed INTEGER;
    v_tasks_total INTEGER;
    v_billable_hours DECIMAL(4,1);
    v_meetings_count INTEGER;
    v_habits_percent DECIMAL(5,2);
    v_garmin_id UUID;
    v_nutrition_id UUID;
BEGIN
    -- Tasks zählen
    SELECT
        COUNT(*) FILTER (WHERE status = 'done'),
        COUNT(*)
    INTO v_tasks_completed, v_tasks_total
    FROM inbox_items
    WHERE (due_date = target_date OR scheduled_date = target_date OR completed_at::DATE = target_date);

    -- Billable Hours
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
    INTO v_billable_hours
    FROM time_entries
    WHERE date = target_date AND is_billable = true;

    -- Meetings zählen
    SELECT COUNT(*)
    INTO v_meetings_count
    FROM meetings
    WHERE start_time::DATE = target_date;

    -- Habits Completion Rate
    SELECT
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE hl.is_completed))::DECIMAL / COUNT(*) * 100
            ELSE 0
        END
    INTO v_habits_percent
    FROM habits h
    LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = target_date
    WHERE h.is_active = true
      AND (h.target_days IS NULL OR EXTRACT(ISODOW FROM target_date)::INTEGER = ANY(
          SELECT jsonb_array_elements_text(h.target_days)::INTEGER
      ));

    -- Garmin Stats ID
    SELECT id INTO v_garmin_id FROM garmin_daily_stats WHERE date = target_date;

    -- Nutrition ID
    SELECT id INTO v_nutrition_id FROM daily_nutrition WHERE date = target_date;

    -- Daily Log updaten oder erstellen
    INSERT INTO daily_logs (
        date,
        tasks_completed_count,
        tasks_total_count,
        billable_hours,
        meetings_count,
        habits_completed_percent,
        garmin_stats_id,
        nutrition_id
    )
    VALUES (
        target_date,
        v_tasks_completed,
        v_tasks_total,
        v_billable_hours,
        v_meetings_count,
        v_habits_percent,
        v_garmin_id,
        v_nutrition_id
    )
    ON CONFLICT (date) DO UPDATE SET
        tasks_completed_count = EXCLUDED.tasks_completed_count,
        tasks_total_count = EXCLUDED.tasks_total_count,
        billable_hours = EXCLUDED.billable_hours,
        meetings_count = EXCLUDED.meetings_count,
        habits_completed_percent = EXCLUDED.habits_completed_percent,
        garmin_stats_id = EXCLUDED.garmin_stats_id,
        nutrition_id = EXCLUDED.nutrition_id,
        updated_at = NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- INDIZES
-- ═══════════════════════════════════════════════════════════════

-- Goals
CREATE INDEX idx_goals_timeframe ON goals(timeframe);
CREATE INDEX idx_goals_area ON goals(area);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id) WHERE parent_goal_id IS NOT NULL;
CREATE INDEX idx_goals_year ON goals(year) WHERE year IS NOT NULL;
CREATE INDEX idx_goals_quarter ON goals(year, quarter) WHERE quarter IS NOT NULL;
CREATE INDEX idx_goals_active ON goals(status) WHERE status IN ('not_started', 'in_progress');
CREATE INDEX idx_goals_dates ON goals(start_date, end_date);

-- Goal Key Results
CREATE INDEX idx_goal_key_results_goal ON goal_key_results(goal_id);
CREATE INDEX idx_goal_key_results_status ON goal_key_results(status);

-- Goal Checkins
CREATE INDEX idx_goal_checkins_goal ON goal_checkins(goal_id);
CREATE INDEX idx_goal_checkins_date ON goal_checkins(date DESC);

-- Daily Logs
CREATE INDEX idx_daily_logs_date ON daily_logs(date DESC);
CREATE INDEX idx_daily_logs_garmin ON daily_logs(garmin_stats_id) WHERE garmin_stats_id IS NOT NULL;

-- Weekly Reviews
CREATE INDEX idx_weekly_reviews_year_week ON weekly_reviews(year DESC, week_number DESC);
CREATE INDEX idx_weekly_reviews_dates ON weekly_reviews(start_date, end_date);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Authenticated Users
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Authenticated users can manage goals"
ON goals FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage goal_key_results"
ON goal_key_results FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage goal_checkins"
ON goal_checkins FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage daily_logs"
ON daily_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage weekly_reviews"
ON weekly_reviews FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Service Role
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Service role has full access to goals"
ON goals FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to goal_key_results"
ON goal_key_results FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to goal_checkins"
ON goal_checkins FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to daily_logs"
ON daily_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to weekly_reviews"
ON weekly_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View: Aktive Ziele mit Progress
CREATE VIEW v_active_goals AS
SELECT
    g.id,
    g.title,
    g.description,
    g.timeframe,
    g.area,
    g.start_date,
    g.end_date,
    g.target_type,
    g.target_value,
    g.current_value,
    g.unit,
    g.progress_percent,
    g.status,
    g.priority,
    pg.title AS parent_goal_title,
    pg.timeframe AS parent_timeframe,
    -- Key Results Count
    (SELECT COUNT(*) FROM goal_key_results kr WHERE kr.goal_id = g.id) AS key_results_count,
    (SELECT COUNT(*) FROM goal_key_results kr WHERE kr.goal_id = g.id AND kr.status = 'completed') AS key_results_completed,
    -- Child Goals Count
    (SELECT COUNT(*) FROM goals cg WHERE cg.parent_goal_id = g.id) AS child_goals_count,
    -- Days remaining
    CASE
        WHEN g.end_date IS NOT NULL THEN g.end_date - CURRENT_DATE
        ELSE NULL
    END AS days_remaining,
    -- On track?
    CASE
        WHEN g.end_date IS NULL THEN 'no_deadline'
        WHEN g.progress_percent >= (
            EXTRACT(EPOCH FROM (CURRENT_DATE - g.start_date)) /
            NULLIF(EXTRACT(EPOCH FROM (g.end_date - g.start_date)), 0) * 100
        ) THEN 'on_track'
        ELSE 'behind'
    END AS track_status
FROM goals g
LEFT JOIN goals pg ON pg.id = g.parent_goal_id
WHERE g.status IN ('not_started', 'in_progress')
ORDER BY
    CASE g.timeframe
        WHEN 'year' THEN 1
        WHEN 'quarter' THEN 2
        WHEN 'month' THEN 3
        WHEN 'week' THEN 4
        WHEN 'day' THEN 5
    END,
    g.priority NULLS LAST,
    g.end_date NULLS LAST;

-- View: Goal Hierarchy (Year -> Quarter -> Month -> Week)
CREATE VIEW v_goal_hierarchy AS
WITH RECURSIVE goal_tree AS (
    -- Top-level goals (Jahresziele ohne Parent)
    SELECT
        g.id,
        g.title,
        g.timeframe,
        g.area,
        g.progress_percent,
        g.status,
        0 AS depth,
        g.id AS root_id,
        ARRAY[g.id] AS path
    FROM goals g
    WHERE g.parent_goal_id IS NULL
      AND g.timeframe = 'year'
      AND g.status IN ('not_started', 'in_progress')

    UNION ALL

    SELECT
        g.id,
        g.title,
        g.timeframe,
        g.area,
        g.progress_percent,
        g.status,
        gt.depth + 1,
        gt.root_id,
        gt.path || g.id
    FROM goals g
    JOIN goal_tree gt ON g.parent_goal_id = gt.id
    WHERE g.status IN ('not_started', 'in_progress')
)
SELECT * FROM goal_tree
ORDER BY root_id, path;

-- ═══════════════════════════════════════════════════════════════
-- Ende Goals Module Schema
-- ═══════════════════════════════════════════════════════════════
