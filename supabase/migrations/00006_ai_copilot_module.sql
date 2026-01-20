-- ═══════════════════════════════════════════════════════════════
-- Life OS - AI Copilot Module Schema
-- Migration: 00006_ai_copilot_module.sql
-- ═══════════════════════════════════════════════════════════════
-- AI Insights, Telegram Bot, Reminders
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. AI_INSIGHTS (Generierte Insights)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(100), -- loan_rate_expiring, tax_free_approaching, low_balance, habit_streak_risk, health_warning, rent_missing, invoice_due, etc.
    category VARCHAR(50), -- wealth, health, productivity, goals
    priority VARCHAR(20), -- info, warning, action_required
    title VARCHAR(500),
    message TEXT,
    data JSONB, -- Zusätzliche strukturierte Daten
    suggested_actions JSONB, -- [{action, label, url}]
    is_read BOOLEAN DEFAULT FALSE,
    is_actioned BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50), -- property, loan, habit, etc.
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────────────────
-- 2. TELEGRAM_MESSAGES (Nachrichtenverlauf)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE telegram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_message_id BIGINT,
    chat_id BIGINT,
    direction VARCHAR(20), -- incoming, outgoing
    message_type VARCHAR(20), -- text, voice, command, callback
    content TEXT,
    transcription TEXT, -- Für Voice Messages (Whisper)
    intent_detected VARCHAR(100), -- task_create, habit_log, balance_query, etc.
    entities_extracted JSONB, -- Extrahierte Entitäten
    action_taken TEXT, -- Was wurde als Reaktion gemacht
    response_time_ms INTEGER, -- Antwortzeit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 3. TELEGRAM_REMINDERS (Erinnerungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE telegram_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_type VARCHAR(100), -- morning_briefing, habit_reminder, supplement_reminder, training_reminder, evening_reflection, weekly_review
    scheduled_time TIME,
    scheduled_days JSONB, -- [1,2,3,4,5,6,7] für Wochentage (1=Mo)
    message_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    conditions JSONB, -- z.B. {"only_if_habit_not_done": true, "habit_id": "..."}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('telegram_reminders');

-- ═══════════════════════════════════════════════════════════════
-- INDIZES
-- ═══════════════════════════════════════════════════════════════

-- AI Insights
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_unread ON ai_insights(is_read) WHERE is_read = false;
CREATE INDEX idx_ai_insights_unactioned ON ai_insights(is_actioned) WHERE is_actioned = false AND priority = 'action_required';
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_expires ON ai_insights(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ai_insights_entity ON ai_insights(related_entity_type, related_entity_id);

-- Telegram Messages
CREATE INDEX idx_telegram_messages_chat ON telegram_messages(chat_id);
CREATE INDEX idx_telegram_messages_direction ON telegram_messages(direction);
CREATE INDEX idx_telegram_messages_intent ON telegram_messages(intent_detected);
CREATE INDEX idx_telegram_messages_created ON telegram_messages(created_at DESC);
CREATE INDEX idx_telegram_messages_telegram_id ON telegram_messages(telegram_message_id);

-- Telegram Reminders
CREATE INDEX idx_telegram_reminders_type ON telegram_reminders(reminder_type);
CREATE INDEX idx_telegram_reminders_active ON telegram_reminders(is_active) WHERE is_active = true;
CREATE INDEX idx_telegram_reminders_time ON telegram_reminders(scheduled_time);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_reminders ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Authenticated Users
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Authenticated users can manage ai_insights"
ON ai_insights FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage telegram_messages"
ON telegram_messages FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage telegram_reminders"
ON telegram_reminders FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Service Role
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Service role has full access to ai_insights"
ON ai_insights FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to telegram_messages"
ON telegram_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to telegram_reminders"
ON telegram_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- INITIAL REMINDERS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO telegram_reminders (reminder_type, scheduled_time, scheduled_days, message_template, is_active) VALUES
    ('morning_briefing', '06:30:00', '[1,2,3,4,5,6,7]', 'Guten Morgen! Hier ist dein tägliches Briefing...', true),
    ('habit_reminder', '08:00:00', '[1,2,3,4,5,6,7]', 'Vergiss nicht deine Morgen-Habits!', true),
    ('supplement_reminder', '07:00:00', '[1,2,3,4,5,6,7]', 'Zeit für deine Morgen-Supplements!', true),
    ('training_reminder', '17:00:00', '[1,2,3,4,5]', 'Heutiges Training: {workout_name}', true),
    ('evening_reflection', '21:00:00', '[1,2,3,4,5,6,7]', 'Zeit für deine Abend-Reflexion. Wie war dein Tag?', true),
    ('weekly_review', '18:00:00', '[7]', 'Zeit für dein Weekly Review!', true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS - Wichtige Dashboard Views
-- ═══════════════════════════════════════════════════════════════

-- View: Ungelesene/Aktionsbedürftige Insights
CREATE VIEW v_pending_insights AS
SELECT
    ai.*,
    CASE
        WHEN ai.priority = 'action_required' AND ai.is_actioned = false THEN 1
        WHEN ai.priority = 'warning' AND ai.is_read = false THEN 2
        WHEN ai.priority = 'info' AND ai.is_read = false THEN 3
        ELSE 4
    END AS sort_priority
FROM ai_insights ai
WHERE (ai.is_read = false OR (ai.priority = 'action_required' AND ai.is_actioned = false))
  AND (ai.expires_at IS NULL OR ai.expires_at > NOW())
ORDER BY sort_priority, ai.created_at DESC;

-- View: Weekly Summary (aggregierte Wochendaten)
CREATE VIEW v_weekly_summary AS
SELECT
    wr.year,
    wr.week_number,
    wr.start_date,
    wr.end_date,
    -- Productivity
    wr.tasks_completed,
    wr.tasks_created,
    wr.tasks_overdue,
    wr.meetings_count,
    wr.meetings_hours,
    wr.billable_hours,
    wr.billable_revenue,
    -- Health
    wr.avg_sleep_score,
    wr.avg_stress,
    wr.workouts_completed,
    wr.workouts_planned,
    wr.habits_completion_rate,
    -- Calculated
    CASE
        WHEN wr.workouts_planned > 0 THEN
            ROUND((wr.workouts_completed::DECIMAL / wr.workouts_planned) * 100, 1)
        ELSE 0
    END AS workout_completion_percent,
    CASE
        WHEN wr.tasks_created > 0 THEN
            ROUND((wr.tasks_completed::DECIMAL / wr.tasks_created) * 100, 1)
        ELSE 0
    END AS task_completion_percent,
    -- Reflexion
    wr.wins,
    wr.challenges,
    wr.lessons_learned,
    wr.next_week_focus,
    wr.overall_rating,
    -- Comparison to previous week
    LAG(wr.tasks_completed) OVER (ORDER BY wr.year, wr.week_number) AS prev_tasks_completed,
    LAG(wr.billable_hours) OVER (ORDER BY wr.year, wr.week_number) AS prev_billable_hours,
    LAG(wr.avg_sleep_score) OVER (ORDER BY wr.year, wr.week_number) AS prev_avg_sleep_score,
    LAG(wr.habits_completion_rate) OVER (ORDER BY wr.year, wr.week_number) AS prev_habits_completion_rate
FROM weekly_reviews wr
ORDER BY wr.year DESC, wr.week_number DESC;

-- View: Daily Dashboard (alle Tagesdaten zusammen)
CREATE VIEW v_daily_dashboard AS
SELECT
    COALESCE(dl.date, g.date, dn.date, dr.date, CURRENT_DATE) AS date,
    -- Daily Log
    dl.morning_mood,
    dl.morning_energy,
    dl.evening_mood,
    dl.evening_energy,
    dl.morning_intention,
    dl.top_3_priorities,
    dl.wins AS daily_wins,
    dl.gratitude,
    dl.tomorrow_focus,
    dl.tasks_completed_count,
    dl.tasks_total_count,
    dl.billable_hours,
    dl.meetings_count AS logged_meetings_count,
    dl.habits_completed_percent,
    -- Garmin Stats
    g.sleep_score,
    g.sleep_duration_minutes,
    g.body_battery_start,
    g.body_battery_end,
    g.stress_avg,
    g.steps,
    g.resting_hr,
    g.hrv_status,
    g.hrv_value,
    -- Nutrition
    dn.calories,
    dn.protein_g,
    dn.carbs_g,
    dn.fat_g,
    dn.water_ml,
    -- Readiness
    dr.readiness_score,
    dr.recommendation AS readiness_recommendation,
    -- Calculated Counts (live)
    (SELECT COUNT(*) FROM inbox_items WHERE status NOT IN ('done', 'delegated')) AS inbox_count,
    (SELECT COUNT(*) FROM inbox_items WHERE due_date = COALESCE(dl.date, CURRENT_DATE) AND status NOT IN ('done', 'delegated')) AS due_today_count,
    (SELECT COUNT(*) FROM inbox_items WHERE due_date < COALESCE(dl.date, CURRENT_DATE) AND status NOT IN ('done', 'delegated')) AS overdue_count,
    (SELECT COUNT(*) FROM meetings WHERE start_time::DATE = COALESCE(dl.date, CURRENT_DATE)) AS meetings_today_count,
    (SELECT COUNT(*) FROM habits WHERE is_active = true) AS total_habits,
    (SELECT COUNT(*) FROM habit_logs WHERE date = COALESCE(dl.date, CURRENT_DATE) AND is_completed = true) AS completed_habits,
    (SELECT COUNT(*) FROM tickets WHERE status NOT IN ('abgeschlossen', 'storniert')) AS open_tickets_count,
    -- Active goals count
    (SELECT COUNT(*) FROM goals WHERE status IN ('not_started', 'in_progress')) AS active_goals_count,
    -- Pending insights
    (SELECT COUNT(*) FROM ai_insights WHERE is_read = false OR (priority = 'action_required' AND is_actioned = false)) AS pending_insights_count
FROM daily_logs dl
FULL OUTER JOIN garmin_daily_stats g ON g.date = dl.date
FULL OUTER JOIN daily_nutrition dn ON dn.date = COALESCE(dl.date, g.date)
FULL OUTER JOIN daily_readiness dr ON dr.date = COALESCE(dl.date, g.date, dn.date)
ORDER BY date DESC;

-- View: Morning Briefing Data (für AI)
CREATE VIEW v_morning_briefing AS
SELECT
    CURRENT_DATE AS date,
    -- Garmin (von gestern Nacht/heute früh)
    g.sleep_score,
    g.sleep_duration_minutes,
    g.body_battery_start AS body_battery,
    g.stress_avg AS yesterday_stress,
    -- Readiness
    dr.readiness_score,
    dr.recommendation AS training_recommendation,
    -- Today's Schedule
    (SELECT jsonb_agg(jsonb_build_object(
        'time', to_char(start_time, 'HH24:MI'),
        'title', title,
        'duration', duration_minutes
    ) ORDER BY start_time)
    FROM meetings
    WHERE start_time::DATE = CURRENT_DATE) AS today_meetings,
    -- Today's Tasks
    (SELECT jsonb_agg(jsonb_build_object(
        'title', title,
        'priority', priority,
        'context', context
    ) ORDER BY priority NULLS LAST)
    FROM inbox_items
    WHERE (due_date = CURRENT_DATE OR scheduled_date = CURRENT_DATE OR status = 'today')
      AND status NOT IN ('done', 'delegated')
    LIMIT 10) AS today_tasks,
    -- Overdue count
    (SELECT COUNT(*) FROM inbox_items WHERE due_date < CURRENT_DATE AND status NOT IN ('done', 'delegated')) AS overdue_count,
    -- Today's Habits
    (SELECT jsonb_agg(jsonb_build_object(
        'name', h.name,
        'target_value', h.target_value,
        'unit', h.unit
    ))
    FROM habits h
    WHERE h.is_active = true
      AND (h.target_days IS NULL OR EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER = ANY(
          SELECT jsonb_array_elements_text(h.target_days)::INTEGER
      ))) AS today_habits,
    -- Today's Supplements
    (SELECT jsonb_agg(jsonb_build_object(
        'name', s.name,
        'dosage', s.dosage_amount,
        'unit', s.dosage_unit,
        'timing', s.timing
    ))
    FROM supplements s
    WHERE s.is_active = true) AS supplements,
    -- Today's Training
    (SELECT jsonb_build_object(
        'plan_name', tp.name,
        'day_name', tpd.name,
        'focus_areas', tpd.focus_areas,
        'duration', tpd.estimated_duration_minutes
    )
    FROM training_plans tp
    JOIN training_plan_days tpd ON tpd.plan_id = tp.id
    WHERE tp.is_active = true
      AND tpd.day_of_week = EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER
    LIMIT 1) AS today_training,
    -- Pending Insights
    (SELECT jsonb_agg(jsonb_build_object(
        'type', insight_type,
        'priority', priority,
        'title', title,
        'message', message
    ) ORDER BY
        CASE priority WHEN 'action_required' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END
    )
    FROM ai_insights
    WHERE is_read = false
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 5) AS pending_insights,
    -- Weather placeholder (von n8n gefüllt)
    NULL::JSONB AS weather
FROM garmin_daily_stats g
FULL OUTER JOIN daily_readiness dr ON dr.date = g.date
WHERE g.date = CURRENT_DATE OR dr.date = CURRENT_DATE
LIMIT 1;

-- View: Nettovermögen Trend (für Charts)
CREATE VIEW v_networth_trend AS
SELECT
    date,
    total_assets,
    total_liabilities,
    net_worth,
    cash_value,
    investment_value,
    property_value,
    company_value,
    LAG(net_worth) OVER (ORDER BY date) AS prev_net_worth,
    net_worth - LAG(net_worth) OVER (ORDER BY date) AS net_worth_change,
    CASE
        WHEN LAG(net_worth) OVER (ORDER BY date) > 0 THEN
            ROUND(((net_worth - LAG(net_worth) OVER (ORDER BY date)) / LAG(net_worth) OVER (ORDER BY date)) * 100, 2)
        ELSE 0
    END AS net_worth_change_percent
FROM daily_snapshots
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Funktion: Clean Up Old Insights
CREATE OR REPLACE FUNCTION cleanup_old_insights(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_insights
    WHERE (is_read = true AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL)
       OR (expires_at IS NOT NULL AND expires_at < NOW());

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Funktion: Generate Weekly Review Metrics
CREATE OR REPLACE FUNCTION generate_weekly_review_metrics(p_year INTEGER, p_week INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Wochenanfang und -ende berechnen
    v_start_date := DATE_TRUNC('week', MAKE_DATE(p_year, 1, 1) + ((p_week - 1) * 7) * INTERVAL '1 day')::DATE;
    v_end_date := v_start_date + 6;

    INSERT INTO weekly_reviews (
        year,
        week_number,
        start_date,
        end_date,
        tasks_completed,
        tasks_created,
        tasks_overdue,
        meetings_count,
        meetings_hours,
        billable_hours,
        billable_revenue,
        inbox_processed,
        inbox_remaining,
        avg_sleep_score,
        avg_stress,
        workouts_completed,
        habits_completion_rate
    )
    SELECT
        p_year,
        p_week,
        v_start_date,
        v_end_date,
        -- Tasks
        (SELECT COUNT(*) FROM inbox_items WHERE completed_at::DATE BETWEEN v_start_date AND v_end_date),
        (SELECT COUNT(*) FROM inbox_items WHERE created_at::DATE BETWEEN v_start_date AND v_end_date),
        (SELECT COUNT(*) FROM inbox_items WHERE due_date < v_end_date AND status NOT IN ('done', 'delegated')),
        -- Meetings
        (SELECT COUNT(*) FROM meetings WHERE start_time::DATE BETWEEN v_start_date AND v_end_date),
        (SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) FROM meetings WHERE start_time::DATE BETWEEN v_start_date AND v_end_date),
        -- Billable
        (SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) FROM time_entries WHERE date BETWEEN v_start_date AND v_end_date AND is_billable = true),
        (SELECT COALESCE(SUM(te.duration_minutes / 60.0 * c.hourly_rate), 0)
         FROM time_entries te JOIN clients c ON c.id = te.client_id
         WHERE te.date BETWEEN v_start_date AND v_end_date AND te.is_billable = true),
        -- Inbox
        (SELECT COUNT(*) FROM inbox_items WHERE completed_at::DATE BETWEEN v_start_date AND v_end_date),
        (SELECT COUNT(*) FROM inbox_items WHERE status NOT IN ('done', 'delegated')),
        -- Health
        (SELECT AVG(sleep_score) FROM garmin_daily_stats WHERE date BETWEEN v_start_date AND v_end_date),
        (SELECT AVG(stress_avg) FROM garmin_daily_stats WHERE date BETWEEN v_start_date AND v_end_date),
        (SELECT COUNT(*) FROM workouts WHERE date BETWEEN v_start_date AND v_end_date),
        -- Habits
        (SELECT
            CASE WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE hl.is_completed))::DECIMAL / COUNT(*) * 100
            ELSE 0 END
         FROM habit_logs hl
         WHERE hl.date BETWEEN v_start_date AND v_end_date)
    ON CONFLICT (year, week_number) DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_created = EXCLUDED.tasks_created,
        tasks_overdue = EXCLUDED.tasks_overdue,
        meetings_count = EXCLUDED.meetings_count,
        meetings_hours = EXCLUDED.meetings_hours,
        billable_hours = EXCLUDED.billable_hours,
        billable_revenue = EXCLUDED.billable_revenue,
        inbox_processed = EXCLUDED.inbox_processed,
        inbox_remaining = EXCLUDED.inbox_remaining,
        avg_sleep_score = EXCLUDED.avg_sleep_score,
        avg_stress = EXCLUDED.avg_stress,
        workouts_completed = EXCLUDED.workouts_completed,
        habits_completion_rate = EXCLUDED.habits_completion_rate;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Ende AI Copilot Module Schema
-- ═══════════════════════════════════════════════════════════════
