-- ═══════════════════════════════════════════════════════════════
-- Enhanced Daily Logs System with Habit Tracking & Journal
-- Migration: 00010_enhanced_daily_logs_system.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Erweitere daily_logs Tabelle (Felder sind bereits vorhanden, prüfe nur user_id)
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Erstelle Index für user_id
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date DESC);

-- 2. Daily Outcomes (Top 3 pro Tag)
CREATE TABLE IF NOT EXISTS daily_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    outcome_text TEXT NOT NULL,
    is_non_negotiable BOOLEAN DEFAULT false,
    why_important TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, outcome_text)
);

CREATE INDEX IF NOT EXISTS idx_daily_outcomes_user_date ON daily_outcomes(user_id, date DESC);

-- 3. Habit Definitions (Master-Liste der zu trackenden Gewohnheiten)
CREATE TABLE IF NOT EXISTS habit_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- z.B. 'health', 'productivity', 'family', 'finance'
    target_value TEXT, -- z.B. '0.5l', '15 min', 'yes/no'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_habit_definitions_user ON habit_definitions(user_id, sort_order);

-- 4. Daily Habit Logs (Tracking pro Tag)
CREATE TABLE IF NOT EXISTS daily_habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    value TEXT, -- Für quantitative Habits (z.B. '30 min')
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_user_date ON daily_habit_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_habit ON daily_habit_logs(habit_id, date DESC);

-- 5. Event Tags (Ereignisse und Kontextfaktoren)
CREATE TABLE IF NOT EXISTS event_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tag_type TEXT NOT NULL, -- 'incident', 'travel', 'illness', 'meeting', 'admin', etc.
    tag_value TEXT, -- Details zum Event
    duration_minutes INTEGER, -- Optional: Dauer
    impact_level INTEGER CHECK (impact_level >= 1 AND impact_level <= 5), -- Wie stark hat es beeinflusst
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tags_user_date ON event_tags(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_event_tags_type ON event_tags(tag_type, date DESC);

-- 6. Weekly Ideal vs Actual (Soll/Ist-Abgleich)
CREATE TABLE IF NOT EXISTS weekly_time_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'customer_work', 'business_building', 'admin', 'family', 'training', 'regeneration'
    planned_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    deviation_reason TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_number, year, category)
);

CREATE INDEX IF NOT EXISTS idx_weekly_time_user ON weekly_time_categories(user_id, year DESC, week_number DESC);

-- 7. Insert default habit definitions für den User
-- Diese werden beim ersten Login automatisch angelegt
CREATE OR REPLACE FUNCTION create_default_habits_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO habit_definitions (user_id, name, description, category, target_value, sort_order) VALUES
    (NEW.id, '0,5l Wasser + Elektrolyte', 'Morgens direkt nach dem Aufstehen', 'health', 'yes/no', 1),
    (NEW.id, '15 Min Bike/Kraft', 'Kurze Bewegungseinheit', 'health', '15 min', 2),
    (NEW.id, '10 Min Meditation', 'Achtsamkeit und Fokus', 'health', '10 min', 3),
    (NEW.id, '10 Min strategische Tagesplanung', 'Top 3 Outcomes definieren', 'productivity', '10 min', 4),
    (NEW.id, 'Fitnessstudio', 'Vollständiges Training', 'health', 'yes/no', 5),
    (NEW.id, 'Inbox Zero light', 'E-Mails 15 Minuten triagiert', 'productivity', '15 min', 6),
    (NEW.id, 'Finanz-Mini', '10 Minuten Finanzübersicht', 'finance', '10 min', 7),
    (NEW.id, 'Familienanker', '20 Min Quality Time', 'family', '20 min', 8)
    ON CONFLICT (user_id, name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger nur erstellen wenn er noch nicht existiert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'create_default_habits_trigger'
    ) THEN
        CREATE TRIGGER create_default_habits_trigger
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION create_default_habits_for_user();
    END IF;
END $$;

-- 8. Add updated_at triggers
DROP TRIGGER IF EXISTS set_timestamp ON daily_outcomes;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON daily_outcomes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON habit_definitions;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON habit_definitions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON daily_habit_logs;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON daily_habit_logs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON event_tags;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON event_tags
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON weekly_time_categories;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON weekly_time_categories
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 9. RLS Policies
ALTER TABLE daily_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_time_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own daily_outcomes" ON daily_outcomes;
CREATE POLICY "Users can manage their own daily_outcomes"
ON daily_outcomes FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own habit_definitions" ON habit_definitions;
CREATE POLICY "Users can manage their own habit_definitions"
ON habit_definitions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own daily_habit_logs" ON daily_habit_logs;
CREATE POLICY "Users can manage their own daily_habit_logs"
ON daily_habit_logs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own event_tags" ON event_tags;
CREATE POLICY "Users can manage their own event_tags"
ON event_tags FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own weekly_time_categories" ON weekly_time_categories;
CREATE POLICY "Users can manage their own weekly_time_categories"
ON weekly_time_categories FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Helper Views für schnelle Abfragen
CREATE OR REPLACE VIEW daily_log_complete AS
SELECT
    dl.*,
    COALESCE(json_agg(
        json_build_object(
            'id', dout.id,
            'outcome_text', dout.outcome_text,
            'completed', dout.completed,
            'is_non_negotiable', dout.is_non_negotiable,
            'why_important', dout.why_important
        ) ORDER BY dout.created_at
    ) FILTER (WHERE dout.id IS NOT NULL), '[]') as outcomes,
    COALESCE(json_agg(
        json_build_object(
            'id', dhl.id,
            'habit_id', dhl.habit_id,
            'habit_name', hd.name,
            'completed', dhl.completed,
            'value', dhl.value
        ) ORDER BY hd.sort_order
    ) FILTER (WHERE dhl.id IS NOT NULL), '[]') as habits,
    COALESCE(json_agg(
        json_build_object(
            'id', et.id,
            'tag_type', et.tag_type,
            'tag_value', et.tag_value,
            'impact_level', et.impact_level
        ) ORDER BY et.created_at
    ) FILTER (WHERE et.id IS NOT NULL), '[]') as events
FROM daily_logs dl
LEFT JOIN daily_outcomes dout ON dl.date = dout.date AND dl.user_id = dout.user_id
LEFT JOIN daily_habit_logs dhl ON dl.date = dhl.date AND dl.user_id = dhl.user_id
LEFT JOIN habit_definitions hd ON dhl.habit_id = hd.id
LEFT JOIN event_tags et ON dl.date = et.date AND dl.user_id = et.user_id
GROUP BY dl.id, dl.user_id, dl.date;

COMMENT ON TABLE daily_outcomes IS 'Top 3 daily outcomes and non-negotiables';
COMMENT ON TABLE habit_definitions IS 'Master list of habits to track';
COMMENT ON TABLE daily_habit_logs IS 'Daily habit completion tracking';
COMMENT ON TABLE event_tags IS 'External events and context factors';
COMMENT ON TABLE weekly_time_categories IS 'Planned vs actual time allocation per week';
