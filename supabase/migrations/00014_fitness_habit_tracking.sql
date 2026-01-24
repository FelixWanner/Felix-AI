-- ═══════════════════════════════════════════════════════════════
-- Fitness Habit Tracking (Good & Bad Habits)
-- Migration: 00014_fitness_habit_tracking.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Fitness Habits Definition Table
CREATE TABLE IF NOT EXISTS fitness_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_name TEXT NOT NULL,
    habit_type TEXT NOT NULL CHECK (habit_type IN ('good', 'bad')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, habit_name, habit_type)
);

CREATE INDEX IF NOT EXISTS idx_fitness_habits_user ON fitness_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_habits_type ON fitness_habits(user_id, habit_type);

-- 2. Daily Fitness Habit Logs
CREATE TABLE IF NOT EXISTS fitness_habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES fitness_habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fitness_habit_logs_user_date ON fitness_habit_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_habit_logs_habit ON fitness_habit_logs(habit_id);

-- 3. RLS Policies
ALTER TABLE fitness_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own fitness_habits" ON fitness_habits;
CREATE POLICY "Users can manage their own fitness_habits"
ON fitness_habits FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own fitness_habit_logs" ON fitness_habit_logs;
CREATE POLICY "Users can manage their own fitness_habit_logs"
ON fitness_habit_logs FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Updated_at Triggers
DROP TRIGGER IF EXISTS set_timestamp ON fitness_habits;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON fitness_habits
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON fitness_habit_logs;
CREATE TRIGGER set_timestamp BEFORE UPDATE ON fitness_habit_logs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE fitness_habits IS 'User-defined fitness habits (good and bad) for tracking';
COMMENT ON TABLE fitness_habit_logs IS 'Daily logs of fitness habit completion';
