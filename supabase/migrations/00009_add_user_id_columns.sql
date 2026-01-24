-- ═══════════════════════════════════════════════════════════════
-- Add user_id columns to all tables for proper multi-tenancy
-- Migration: 00009_add_user_id_columns.sql
-- ═══════════════════════════════════════════════════════════════

-- Add user_id to inbox_items
ALTER TABLE inbox_items
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to meetings
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to time_entries
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to tickets
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to goals (if not exists)
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS idx_inbox_items_user ON inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Authenticated users can manage inbox_items" ON inbox_items;
CREATE POLICY "Users can manage their own inbox_items"
ON inbox_items FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage clients" ON clients;
CREATE POLICY "Users can manage their own clients"
ON clients FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage meetings" ON meetings;
CREATE POLICY "Users can manage their own meetings"
ON meetings FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage time_entries" ON time_entries;
CREATE POLICY "Users can manage their own time_entries"
ON time_entries FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;
CREATE POLICY "Users can manage their own tickets"
ON tickets FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage documents" ON documents;
CREATE POLICY "Users can manage their own documents"
ON documents FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage goals" ON goals;
CREATE POLICY "Users can manage their own goals"
ON goals FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
