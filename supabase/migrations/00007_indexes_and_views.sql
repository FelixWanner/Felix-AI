-- ═══════════════════════════════════════════════════════════════
-- Life OS - Indexes and Views
-- Migration: 00007_indexes_and_views.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Additional Indexes for Performance
-- ───────────────────────────────────────────────────────────────

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date_completed ON habit_logs(date, is_completed);
CREATE INDEX IF NOT EXISTS idx_inbox_items_status_due ON inbox_items(status, due_date);
CREATE INDEX IF NOT EXISTS idx_workouts_date_type ON workouts(date, type);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_inbox_items_title_trgm ON inbox_items USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);

-- ───────────────────────────────────────────────────────────────
-- Materialized Views for Dashboard
-- ───────────────────────────────────────────────────────────────

-- Net Worth Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_net_worth_summary AS
SELECT
    COALESCE(SUM(CASE WHEN account_type IN ('giro', 'tagesgeld', 'festgeld', 'privat') THEN current_balance ELSE 0 END), 0) as cash_total,
    COALESCE(SUM(CASE WHEN account_type = 'depot' THEN current_balance ELSE 0 END), 0) as investments_total,
    COALESCE(SUM(CASE WHEN account_type = 'darlehen' THEN current_balance ELSE 0 END), 0) as loans_total,
    (SELECT COALESCE(SUM(current_value), 0) FROM properties) as properties_total,
    (SELECT COALESCE(SUM(your_share_value), 0) FROM companies) as companies_total,
    NOW() as calculated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_net_worth_summary ON mv_net_worth_summary(calculated_at);

-- Today's Overview
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_today_overview AS
SELECT
    CURRENT_DATE as date,
    (SELECT COUNT(*) FROM inbox_items WHERE status IN ('inbox', 'today') AND (due_date IS NULL OR due_date <= CURRENT_DATE)) as pending_tasks,
    (SELECT COUNT(*) FROM inbox_items WHERE status = 'done' AND completed_at::date = CURRENT_DATE) as completed_tasks,
    (SELECT COUNT(*) FROM meetings WHERE start_time::date = CURRENT_DATE) as meetings_today,
    (SELECT COUNT(*) FROM habits WHERE is_active = true) as total_habits,
    (SELECT COUNT(*) FROM habit_logs WHERE date = CURRENT_DATE AND is_completed = true) as completed_habits,
    (SELECT readiness_score FROM daily_readiness WHERE date = CURRENT_DATE) as readiness_score,
    (SELECT sleep_score FROM garmin_daily_stats WHERE date = CURRENT_DATE - 1) as last_sleep_score,
    NOW() as calculated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_today_overview ON mv_today_overview(date);

-- Property Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_performance AS
SELECT
    p.id as property_id,
    p.name as property_name,
    p.current_value,
    COALESCE(SUM(u.monthly_rent_cold), 0) as total_monthly_rent,
    COALESCE(SUM(u.monthly_rent_cold) * 12, 0) as annual_rent,
    CASE
        WHEN p.current_value > 0 THEN ROUND((COALESCE(SUM(u.monthly_rent_cold), 0) * 12 / p.current_value * 100)::numeric, 2)
        ELSE 0
    END as gross_yield_percent,
    COUNT(u.id) as unit_count,
    COUNT(CASE WHEN u.status = 'vermietet' THEN 1 END) as rented_units,
    COUNT(CASE WHEN u.status = 'leer' THEN 1 END) as vacant_units,
    (SELECT COALESCE(SUM(current_balance), 0) FROM loans WHERE property_id = p.id) as total_loans,
    NOW() as calculated_at
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
GROUP BY p.id, p.name, p.current_value;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_property_performance ON mv_property_performance(property_id);

-- Habit Streaks
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_habit_streaks AS
WITH habit_dates AS (
    SELECT
        habit_id,
        date,
        is_completed,
        date - ROW_NUMBER() OVER (PARTITION BY habit_id, is_completed ORDER BY date)::int AS grp
    FROM habit_logs
    WHERE is_completed = true
),
streaks AS (
    SELECT
        habit_id,
        MIN(date) as streak_start,
        MAX(date) as streak_end,
        COUNT(*) as streak_length
    FROM habit_dates
    GROUP BY habit_id, grp
)
SELECT
    h.id as habit_id,
    h.name as habit_name,
    COALESCE(MAX(s.streak_length), 0) as longest_streak,
    COALESCE(
        (SELECT streak_length FROM streaks WHERE habit_id = h.id AND streak_end = CURRENT_DATE - 1 OR streak_end = CURRENT_DATE),
        0
    ) as current_streak,
    (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id AND is_completed = true AND date >= CURRENT_DATE - 30) as last_30_days_completed,
    NOW() as calculated_at
FROM habits h
LEFT JOIN streaks s ON s.habit_id = h.id
WHERE h.is_active = true
GROUP BY h.id, h.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_habit_streaks ON mv_habit_streaks(habit_id);

-- ───────────────────────────────────────────────────────────────
-- Regular Views
-- ───────────────────────────────────────────────────────────────

-- Upcoming Loan Milestones
CREATE OR REPLACE VIEW v_upcoming_loan_milestones AS
SELECT
    l.id as loan_id,
    l.loan_number,
    p.name as property_name,
    b.name as bank_name,
    l.interest_fixed_until,
    l.current_balance,
    l.interest_rate_nominal,
    l.monthly_payment,
    EXTRACT(DAYS FROM (l.interest_fixed_until - CURRENT_DATE)) as days_until_refinance,
    CASE
        WHEN l.interest_fixed_until <= CURRENT_DATE + INTERVAL '6 months' THEN 'urgent'
        WHEN l.interest_fixed_until <= CURRENT_DATE + INTERVAL '1 year' THEN 'attention'
        WHEN l.interest_fixed_until <= CURRENT_DATE + INTERVAL '2 years' THEN 'planning'
        ELSE 'ok'
    END as urgency
FROM loans l
JOIN properties p ON p.id = l.property_id
JOIN banks b ON b.id = l.bank_id
WHERE l.interest_fixed_until IS NOT NULL
ORDER BY l.interest_fixed_until;

-- Tax-Free Sale Eligibility
CREATE OR REPLACE VIEW v_tax_free_eligibility AS
SELECT
    p.id as property_id,
    p.name,
    p.purchase_date,
    p.purchase_date + INTERVAL '10 years' as tax_free_date,
    CASE
        WHEN p.purchase_date + INTERVAL '10 years' <= CURRENT_DATE THEN true
        ELSE false
    END as is_tax_free,
    EXTRACT(DAYS FROM (p.purchase_date + INTERVAL '10 years' - CURRENT_DATE)) as days_until_tax_free,
    p.current_value,
    p.purchase_price,
    p.current_value - p.purchase_price as estimated_gain
FROM properties p
WHERE p.purchase_date IS NOT NULL
ORDER BY p.purchase_date + INTERVAL '10 years';

-- Weekly Time Summary
CREATE OR REPLACE VIEW v_weekly_time_summary AS
SELECT
    DATE_TRUNC('week', date) as week_start,
    client_id,
    c.name as client_name,
    SUM(duration_minutes) as total_minutes,
    ROUND(SUM(duration_minutes) / 60.0, 1) as total_hours,
    SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) as billable_minutes,
    ROUND(SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) / 60.0, 1) as billable_hours,
    ROUND(SUM(CASE WHEN is_billable THEN duration_minutes * c.hourly_rate / 60.0 ELSE 0 END), 2) as billable_amount
FROM time_entries te
LEFT JOIN clients c ON c.id = te.client_id
GROUP BY DATE_TRUNC('week', date), client_id, c.name
ORDER BY week_start DESC, billable_amount DESC;

-- Health Dashboard
CREATE OR REPLACE VIEW v_health_dashboard AS
SELECT
    gds.date,
    gds.sleep_score,
    gds.body_battery_start,
    gds.stress_avg,
    gds.steps,
    gds.resting_hr,
    gds.hrv_value,
    dr.readiness_score,
    dr.recommendation as readiness_recommendation,
    dn.calories,
    dn.protein_g,
    w.type as workout_type,
    w.duration_minutes as workout_duration,
    (SELECT COUNT(*) FROM habit_logs WHERE date = gds.date AND is_completed = true) as habits_completed,
    (SELECT COUNT(*) FROM supplement_logs WHERE date = gds.date AND is_taken = true) as supplements_taken
FROM garmin_daily_stats gds
LEFT JOIN daily_readiness dr ON dr.date = gds.date
LEFT JOIN daily_nutrition dn ON dn.date = gds.date
LEFT JOIN workouts w ON w.date = gds.date
ORDER BY gds.date DESC;

-- Inbox Priority View
CREATE OR REPLACE VIEW v_inbox_prioritized AS
SELECT
    i.*,
    p.name as property_name,
    t.name as tenant_name,
    c.name as client_name,
    g.title as goal_title,
    CASE
        WHEN i.due_date < CURRENT_DATE THEN 1
        WHEN i.due_date = CURRENT_DATE THEN 2
        WHEN i.status = 'today' THEN 3
        WHEN i.priority = 1 THEN 4
        WHEN i.priority = 2 THEN 5
        ELSE 10
    END as sort_priority
FROM inbox_items i
LEFT JOIN properties p ON p.id = i.property_id
LEFT JOIN tenants t ON t.id = i.tenant_id
LEFT JOIN clients c ON c.id = i.client_id
LEFT JOIN goals g ON g.id = i.goal_id
WHERE i.status NOT IN ('done', 'delegated')
ORDER BY sort_priority, i.due_date NULLS LAST, i.created_at;

-- ───────────────────────────────────────────────────────────────
-- Refresh Functions for Materialized Views
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_net_worth_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_today_overview;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_habit_streaks;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────
-- Utility Functions
-- ───────────────────────────────────────────────────────────────

-- Get account balance changes
CREATE OR REPLACE FUNCTION get_account_balance_changes(
    p_account_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    daily_change DECIMAL,
    running_balance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.date,
        SUM(t.amount) as daily_change,
        SUM(SUM(t.amount)) OVER (ORDER BY t.date) as running_balance
    FROM transactions t
    WHERE t.account_id = p_account_id
      AND t.date >= CURRENT_DATE - p_days
    GROUP BY t.date
    ORDER BY t.date;
END;
$$ LANGUAGE plpgsql;

-- Search across all entities
CREATE OR REPLACE FUNCTION global_search(search_term TEXT, max_results INTEGER DEFAULT 20)
RETURNS TABLE (
    entity_type VARCHAR,
    entity_id UUID,
    title VARCHAR,
    subtitle VARCHAR,
    relevance FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        -- Properties
        SELECT
            'property'::VARCHAR,
            p.id,
            p.name::VARCHAR,
            p.address::VARCHAR,
            similarity(p.name || ' ' || COALESCE(p.address, ''), search_term) as rel
        FROM properties p
        WHERE p.name ILIKE '%' || search_term || '%' OR p.address ILIKE '%' || search_term || '%'

        UNION ALL

        -- Contacts
        SELECT
            'contact'::VARCHAR,
            c.id,
            (COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, ''))::VARCHAR,
            c.company_name::VARCHAR,
            similarity(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') || ' ' || COALESCE(c.company_name, ''), search_term)
        FROM contacts c
        WHERE c.first_name ILIKE '%' || search_term || '%'
           OR c.last_name ILIKE '%' || search_term || '%'
           OR c.company_name ILIKE '%' || search_term || '%'

        UNION ALL

        -- Inbox Items
        SELECT
            'task'::VARCHAR,
            i.id,
            i.title::VARCHAR,
            i.status::VARCHAR,
            similarity(i.title, search_term)
        FROM inbox_items i
        WHERE i.title ILIKE '%' || search_term || '%'

        UNION ALL

        -- Documents
        SELECT
            'document'::VARCHAR,
            d.id,
            d.title::VARCHAR,
            d.document_type::VARCHAR,
            similarity(d.title, search_term)
        FROM documents d
        WHERE d.title ILIKE '%' || search_term || '%'
    ) results
    ORDER BY relevance DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Ende Indexes and Views
-- ═══════════════════════════════════════════════════════════════
