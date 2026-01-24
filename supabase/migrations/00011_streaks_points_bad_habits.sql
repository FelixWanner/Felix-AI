-- ═══════════════════════════════════════════════════════════════
-- Streaks, Points System & Bad Habits
-- Migration: 00011_streaks_points_bad_habits.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Erweitere habit_definitions um habit_type (good/bad) und points
ALTER TABLE habit_definitions
ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'good' CHECK (habit_type IN ('good', 'bad')),
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

-- 2. User Points/Stats Tabelle
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    points_to_next_level INTEGER DEFAULT 100,
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    total_habits_completed INTEGER DEFAULT 0,
    total_outcomes_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- 3. Habit Streaks Tabelle
CREATE TABLE IF NOT EXISTS habit_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_user ON habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_habit ON habit_streaks(habit_id);

-- 4. Points History (für Gamification und Tracking)
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL, -- 'habit_completed', 'outcome_achieved', 'streak_bonus', etc.
    reference_id UUID, -- ID der Gewohnheit, Outcome, etc.
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_user_date ON points_history(user_id, date DESC);

-- 5. Füge Standard schlechte Gewohnheiten hinzu (werden bei Login erstellt)
CREATE OR REPLACE FUNCTION create_default_bad_habits_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Schlechte Gewohnheiten (negative Punkte)
    INSERT INTO habit_definitions (user_id, name, description, category, habit_type, points, is_active, sort_order) VALUES
    (NEW.id, 'Feierabendbier', 'Alkohol am Abend', 'health', 'bad', -5, true, 100),
    (NEW.id, 'Ungesundes Essen', 'Fast Food, Süßigkeiten', 'health', 'bad', -10, true, 101),
    (NEW.id, 'Social Media Doom Scrolling', 'Mehr als 30 Min sinnloses Scrollen', 'productivity', 'bad', -5, true, 102),
    (NEW.id, 'Zu spät ins Bett', 'Nach 23 Uhr', 'health', 'bad', -10, true, 103)
    ON CONFLICT (user_id, name) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für schlechte Gewohnheiten
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'create_default_bad_habits_trigger'
    ) THEN
        CREATE TRIGGER create_default_bad_habits_trigger
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION create_default_bad_habits_for_user();
    END IF;
END $$;

-- 6. Funktion um Punkte zu aktualisieren
CREATE OR REPLACE FUNCTION update_user_points(
    p_user_id UUID,
    p_points INTEGER,
    p_reason TEXT,
    p_reference_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_new_total INTEGER;
    v_current_level INTEGER;
    v_points_to_next INTEGER;
BEGIN
    -- Erstelle user_stats wenn nicht vorhanden
    INSERT INTO user_stats (user_id, total_points)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Aktualisiere Punkte
    UPDATE user_stats
    SET total_points = total_points + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_points INTO v_new_total;

    -- Berechne Level (alle 100 Punkte = 1 Level)
    v_current_level := FLOOR(v_new_total / 100.0) + 1;
    v_points_to_next := 100 - (v_new_total % 100);

    UPDATE user_stats
    SET current_level = v_current_level,
        points_to_next_level = v_points_to_next
    WHERE user_id = p_user_id;

    -- Log in points_history
    INSERT INTO points_history (user_id, points, reason, reference_id, date)
    VALUES (p_user_id, p_points, p_reason, p_reference_id, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 7. Funktion um Streak zu aktualisieren
CREATE OR REPLACE FUNCTION update_habit_streak(
    p_user_id UUID,
    p_habit_id UUID,
    p_date DATE,
    p_completed BOOLEAN
)
RETURNS void AS $$
DECLARE
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_last_date DATE;
    v_habit_type TEXT;
    v_points INTEGER;
BEGIN
    -- Hole Habit Typ und Punkte
    SELECT habit_type, points INTO v_habit_type, v_points
    FROM habit_definitions
    WHERE id = p_habit_id;

    -- Erstelle streak record wenn nicht vorhanden
    INSERT INTO habit_streaks (user_id, habit_id, current_streak, longest_streak)
    VALUES (p_user_id, p_habit_id, 0, 0)
    ON CONFLICT (user_id, habit_id) DO NOTHING;

    -- Hole aktuellen Streak
    SELECT current_streak, longest_streak, last_completed_date
    INTO v_current_streak, v_longest_streak, v_last_date
    FROM habit_streaks
    WHERE user_id = p_user_id AND habit_id = p_habit_id;

    IF p_completed THEN
        -- Prüfe ob gestern completed war (Streak continues)
        IF v_last_date = p_date - INTERVAL '1 day' THEN
            v_current_streak := v_current_streak + 1;
        ELSIF v_last_date = p_date THEN
            -- Gleicher Tag, keine Änderung
            RETURN;
        ELSE
            -- Streak broken, start new
            v_current_streak := 1;
        END IF;

        -- Update longest streak
        IF v_current_streak > v_longest_streak THEN
            v_longest_streak := v_current_streak;
        END IF;

        -- Update streak record
        UPDATE habit_streaks
        SET current_streak = v_current_streak,
            longest_streak = v_longest_streak,
            last_completed_date = p_date,
            updated_at = NOW()
        WHERE user_id = p_user_id AND habit_id = p_habit_id;

        -- Update user stats
        UPDATE user_stats
        SET total_habits_completed = total_habits_completed + 1,
            current_streak = GREATEST(current_streak, v_current_streak),
            longest_streak = GREATEST(longest_streak, v_longest_streak)
        WHERE user_id = p_user_id;

        -- Vergebe Punkte (gute Gewohnheit = positive Punkte, schlechte = negative)
        PERFORM update_user_points(p_user_id, v_points, 'habit_completed', p_habit_id);

        -- Streak Bonus alle 7 Tage
        IF v_current_streak % 7 = 0 THEN
            PERFORM update_user_points(p_user_id, 20, 'streak_bonus_7days', p_habit_id);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS Policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own user_stats" ON user_stats;
CREATE POLICY "Users can manage their own user_stats"
ON user_stats FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own habit_streaks" ON habit_streaks;
CREATE POLICY "Users can manage their own habit_streaks"
ON habit_streaks FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own points_history" ON points_history;
CREATE POLICY "Users can manage their own points_history"
ON points_history FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Triggers für updated_at
DROP TRIGGER IF EXISTS set_timestamp ON user_stats;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON user_stats
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON habit_streaks;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON habit_streaks
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE user_stats IS 'User gamification stats: points, levels, streaks';
COMMENT ON TABLE habit_streaks IS 'Habit completion streaks';
COMMENT ON TABLE points_history IS 'History of all point gains/losses';
