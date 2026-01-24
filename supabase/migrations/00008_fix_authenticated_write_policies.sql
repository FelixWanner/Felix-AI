-- Migration: Add missing write policies for authenticated users
-- This fixes the issue where dashboard data could not be saved from the frontend
-- because only SELECT policies existed for authenticated users

-- ───────────────────────────────────────────────────────────────
-- Habit Logs - Allow authenticated users to INSERT and UPDATE
-- ───────────────────────────────────────────────────────────────

-- Drop existing read-only policy if it exists
DROP POLICY IF EXISTS "Authenticated read access" ON habit_logs;

-- Create full CRUD policy for authenticated users
CREATE POLICY "Authenticated users can manage habit_logs"
ON habit_logs FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Habits - Allow authenticated users to manage habits
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON habits;

CREATE POLICY "Authenticated users can manage habits"
ON habits FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Daily Nutrition - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON daily_nutrition;

CREATE POLICY "Authenticated users can manage daily_nutrition"
ON daily_nutrition FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Supplements - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON supplements;

CREATE POLICY "Authenticated users can manage supplements"
ON supplements FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON supplement_logs;

CREATE POLICY "Authenticated users can manage supplement_logs"
ON supplement_logs FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON supplement_cycles;

CREATE POLICY "Authenticated users can manage supplement_cycles"
ON supplement_cycles FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Garmin Stats - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON garmin_daily_stats;

CREATE POLICY "Authenticated users can manage garmin_daily_stats"
ON garmin_daily_stats FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Training - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON training_plans;

CREATE POLICY "Authenticated users can manage training_plans"
ON training_plans FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON training_plan_days;

CREATE POLICY "Authenticated users can manage training_plan_days"
ON training_plan_days FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON exercises;

CREATE POLICY "Authenticated users can manage exercises"
ON exercises FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON workouts;

CREATE POLICY "Authenticated users can manage workouts"
ON workouts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON workout_sets;

CREATE POLICY "Authenticated users can manage workout_sets"
ON workout_sets FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Daily Readiness & Body Measurements - Allow authenticated users
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON daily_readiness;

CREATE POLICY "Authenticated users can manage daily_readiness"
ON daily_readiness FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON body_measurements;

CREATE POLICY "Authenticated users can manage body_measurements"
ON body_measurements FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- Daily Logs - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

-- Check if daily_logs table exists and add policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'daily_logs') THEN
    DROP POLICY IF EXISTS "Authenticated read access" ON daily_logs;

    IF NOT EXISTS (
      SELECT FROM pg_policies WHERE tablename = 'daily_logs' AND policyname = 'Authenticated users can manage daily_logs'
    ) THEN
      CREATE POLICY "Authenticated users can manage daily_logs"
      ON daily_logs FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- Productivity Module - Fix policies for all tables
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON clients;
CREATE POLICY "Authenticated users can manage clients"
ON clients FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON goals;
CREATE POLICY "Authenticated users can manage goals"
ON goals FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON inbox_items;
CREATE POLICY "Authenticated users can manage inbox_items"
ON inbox_items FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON meetings;
CREATE POLICY "Authenticated users can manage meetings"
ON meetings FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON meeting_action_items;
CREATE POLICY "Authenticated users can manage meeting_action_items"
ON meeting_action_items FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON time_entries;
CREATE POLICY "Authenticated users can manage time_entries"
ON time_entries FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON tickets;
CREATE POLICY "Authenticated users can manage tickets"
ON tickets FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON ticket_comments;
CREATE POLICY "Authenticated users can manage ticket_comments"
ON ticket_comments FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON documents;
CREATE POLICY "Authenticated users can manage documents"
ON documents FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read access" ON document_embeddings;
CREATE POLICY "Authenticated users can manage document_embeddings"
ON document_embeddings FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- AI Insights - Allow authenticated users to manage
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated read access" ON ai_insights;

-- Only create if it doesn't exist (might already exist from ai_copilot_module)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'ai_insights' AND policyname = 'Authenticated users can manage ai_insights'
  ) THEN
    CREATE POLICY "Authenticated users can manage ai_insights"
    ON ai_insights FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- Enable Realtime for key tables
-- ───────────────────────────────────────────────────────────────

-- Enable realtime for tables so dashboard updates automatically
-- Using DO block to handle cases where tables may already be in publication
DO $$
BEGIN
  -- Habit related tables
  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'habit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habit_logs;
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'habits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habits;
  END IF;

  -- Health related tables
  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_readiness'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_readiness;
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'garmin_daily_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE garmin_daily_stats;
  END IF;

  -- Productivity related tables
  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'inbox_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inbox_items;
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'goals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE goals;
  END IF;

  -- AI Insights for alerts
  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_insights'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
  END IF;

  -- Daily snapshots for net worth updates
  IF NOT EXISTS (
    SELECT FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_snapshots;
  END IF;
END $$;
