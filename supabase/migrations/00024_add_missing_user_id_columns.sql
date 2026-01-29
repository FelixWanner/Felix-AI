-- ═══════════════════════════════════════════════════════════════
-- Add missing user_id columns for multi-user support
-- Migration: 00024_add_missing_user_id_columns.sql
-- ═══════════════════════════════════════════════════════════════

-- Add user_id to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);

-- Add user_id to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Enable RLS on these tables if not already enabled
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
DROP POLICY IF EXISTS "Users can manage their own meetings" ON meetings;
CREATE POLICY "Users can manage their own meetings"
ON meetings FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for goals
DROP POLICY IF EXISTS "Users can manage their own goals" ON goals;
CREATE POLICY "Users can manage their own goals"
ON goals FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
