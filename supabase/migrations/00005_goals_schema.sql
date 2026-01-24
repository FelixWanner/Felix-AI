-- ═══════════════════════════════════════════════════════════════
-- Life OS - Goals Module Schema
-- Migration: 00005_goals_schema.sql
-- ═══════════════════════════════════════════════════════════════
-- Note: goals table was created in 00003 for FK references
-- This migration adds remaining goal-related tables
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Goal Key Results (Key Results für OKRs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE goal_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goal_key_results_goal ON goal_key_results(goal_id);
CREATE INDEX idx_goal_key_results_status ON goal_key_results(status);

-- ───────────────────────────────────────────────────────────────
-- Goal Checkins (Reviews)
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

CREATE INDEX idx_goal_checkins_goal ON goal_checkins(goal_id);
CREATE INDEX idx_goal_checkins_date ON goal_checkins(date);

-- ───────────────────────────────────────────────────────────────
-- Daily Logs (Tagesrückblick)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    -- Morgen-Routine
    morning_mood INTEGER, -- 1-10
    morning_energy INTEGER, -- 1-10
    morning_intention TEXT,
    top_3_priorities JSONB,

    -- Abend-Reflexion
    evening_mood INTEGER, -- 1-10
    evening_energy INTEGER, -- 1-10
    wins JSONB,
    lessons JSONB,
    gratitude JSONB,
    tomorrow_focus TEXT,

    -- Aggregierte Daten
    tasks_completed_count INTEGER,
    tasks_total_count INTEGER,
    billable_hours DECIMAL(4,1),
    meetings_count INTEGER,
    habits_completed_percent DECIMAL(5,2),

    -- Verknüpfungen
    garmin_stats_id UUID REFERENCES garmin_daily_stats(id),
    nutrition_id UUID REFERENCES daily_nutrition(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('daily_logs');
CREATE INDEX idx_daily_logs_date ON daily_logs(date);

-- ───────────────────────────────────────────────────────────────
-- Weekly Reviews (Wochenrückblick)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,

    -- Auto-Metriken
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
    weekly_goals_completed JSONB,
    weekly_goals_missed JSONB,

    -- Health
    avg_sleep_score DECIMAL(5,1),
    avg_stress DECIMAL(5,1),
    workouts_completed INTEGER,
    workouts_planned INTEGER,
    habits_completion_rate DECIMAL(5,2),

    -- Reflexion
    wins JSONB,
    challenges JSONB,
    lessons_learned TEXT,
    next_week_focus TEXT,
    overall_rating INTEGER, -- 1-10

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number)
);

CREATE INDEX idx_weekly_reviews_year_week ON weekly_reviews(year, week_number);

-- ───────────────────────────────────────────────────────────────
-- Monthly Reviews (Monatsrückblick)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE monthly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Wealth Metrics
    net_worth_start DECIMAL(14,2),
    net_worth_end DECIMAL(14,2),
    net_worth_change DECIMAL(14,2),
    income_total DECIMAL(12,2),
    expenses_total DECIMAL(12,2),
    savings_rate DECIMAL(5,2),

    -- Productivity Metrics
    tasks_completed INTEGER,
    projects_completed INTEGER,
    billable_hours DECIMAL(6,1),
    billable_revenue DECIMAL(12,2),

    -- Health Metrics
    avg_sleep_score DECIMAL(5,1),
    avg_readiness DECIMAL(5,1),
    workouts_total INTEGER,
    habits_avg_completion DECIMAL(5,2),
    weight_start DECIMAL(5,2),
    weight_end DECIMAL(5,2),

    -- Goals
    monthly_goals_status JSONB,

    -- Reflexion
    biggest_wins JSONB,
    biggest_challenges JSONB,
    lessons_learned TEXT,
    next_month_focus TEXT,
    overall_rating INTEGER, -- 1-10

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, month)
);

CREATE INDEX idx_monthly_reviews_year_month ON monthly_reviews(year, month);

-- ───────────────────────────────────────────────────────────────
-- Quarterly Reviews
-- ───────────────────────────────────────────────────────────────
CREATE TABLE quarterly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,

    -- OKR Status
    okrs_completed INTEGER,
    okrs_total INTEGER,
    okr_details JSONB,

    -- Key Metrics
    net_worth_change DECIMAL(14,2),
    revenue_total DECIMAL(12,2),
    major_accomplishments JSONB,
    major_challenges JSONB,

    -- Next Quarter Planning
    next_quarter_okrs JSONB,
    focus_areas JSONB,

    overall_rating INTEGER, -- 1-10
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, quarter)
);

CREATE INDEX idx_quarterly_reviews_year_quarter ON quarterly_reviews(year, quarter);

-- ───────────────────────────────────────────────────────────────
-- FIRE Progress (Financial Independence Tracking)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE fire_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,

    -- Current State
    net_worth DECIMAL(14,2),
    fire_target DECIMAL(14,2),
    progress_percent DECIMAL(5,2),

    -- Income & Expenses
    passive_income_monthly DECIMAL(12,2),
    active_income_monthly DECIMAL(12,2),
    expenses_monthly DECIMAL(12,2),

    -- Projections
    years_to_fire DECIMAL(4,1),
    fire_date_projected DATE,
    safe_withdrawal_amount DECIMAL(12,2),

    -- Breakdown
    real_estate_equity DECIMAL(14,2),
    investment_portfolio DECIMAL(14,2),
    cash_reserves DECIMAL(14,2),
    company_equity DECIMAL(14,2),
    other_assets DECIMAL(14,2),
    total_liabilities DECIMAL(14,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fire_progress_date ON fire_progress(date);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

ALTER TABLE goal_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_progress ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON goal_key_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON goal_checkins FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON daily_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON weekly_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON monthly_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON quarterly_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON fire_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
CREATE POLICY "Authenticated read access" ON goal_key_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON goal_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON weekly_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON monthly_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON quarterly_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON fire_progress FOR SELECT TO authenticated USING (true);

-- ───────────────────────────────────────────────────────────────
-- Helper Functions
-- ───────────────────────────────────────────────────────────────

-- Calculate goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent goal progress if this is a child goal
    IF NEW.parent_goal_id IS NOT NULL THEN
        UPDATE goals
        SET current_value = (
            SELECT COALESCE(AVG(progress_percent), 0)
            FROM goals
            WHERE parent_goal_id = NEW.parent_goal_id
        ),
        progress_percent = (
            SELECT COALESCE(AVG(progress_percent), 0)
            FROM goals
            WHERE parent_goal_id = NEW.parent_goal_id
        )
        WHERE id = NEW.parent_goal_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_goal_progress
    AFTER INSERT OR UPDATE OF progress_percent ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Calculate FIRE progress
CREATE OR REPLACE FUNCTION calculate_fire_years(
    p_net_worth DECIMAL,
    p_fire_target DECIMAL,
    p_monthly_savings DECIMAL,
    p_growth_rate DECIMAL DEFAULT 0.07
)
RETURNS DECIMAL AS $$
DECLARE
    v_years DECIMAL;
BEGIN
    IF p_net_worth >= p_fire_target THEN
        RETURN 0;
    END IF;

    IF p_monthly_savings <= 0 THEN
        RETURN 999;
    END IF;

    -- Simplified compound growth calculation
    v_years := LN((p_fire_target * p_growth_rate + p_monthly_savings * 12) /
                  (p_net_worth * p_growth_rate + p_monthly_savings * 12)) / LN(1 + p_growth_rate);

    RETURN GREATEST(v_years, 0);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Ende Goals Schema
-- ═══════════════════════════════════════════════════════════════
