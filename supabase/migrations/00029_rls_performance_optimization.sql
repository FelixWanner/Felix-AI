-- ═══════════════════════════════════════════════════════════════
-- Migration: RLS Performance Optimization
-- Description: Fixes auth.uid() initplan issues and removes duplicate policies
-- Date: 2026-01-29
--
-- Issues addressed:
-- 1. auth_rls_initplan: Wrap auth.uid() in (select ...) to avoid per-row re-evaluation
-- 2. multiple_permissive_policies: Remove duplicate policies for same role/action
-- 3. duplicate_index: Remove redundant indexes
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PART 1: Remove duplicate permissive policies
-- Tables have both "Authenticated read access" AND "Authenticated users can manage X"
-- Keep only the broader "manage" policy which covers all operations
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  tables_with_duplicate_read TEXT[] := ARRAY[
    'accounts', 'ai_insights', 'banks', 'cashflow_forecast', 'clients',
    'companies', 'contact_properties', 'contact_specialties', 'contacts',
    'daily_logs', 'daily_nutrition', 'daily_readiness', 'daily_snapshots',
    'exercises', 'garmin_daily_stats', 'goal_checkins', 'goal_key_results',
    'habit_logs', 'habits', 'invoices', 'loan_scenarios', 'loan_schedule',
    'loans', 'meeting_action_items', 'portfolios', 'position_history',
    'positions', 'property_milestones', 'property_scenarios', 'property_tax_data',
    'recurring_transactions', 'savings_plans', 'supplement_cycles', 'supplement_logs',
    'supplements', 'telegram_messages', 'telegram_reminders', 'tenants',
    'ticket_comments', 'tickets', 'time_entries', 'training_plan_days',
    'transactions', 'units', 'weekly_reviews', 'workout_sets', 'workouts'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_with_duplicate_read
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read access" ON public.%I', t);
  END LOOP;
END $$;

-- Special cases: tables with triple duplicate policies
DROP POLICY IF EXISTS "Authenticated read access" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can manage goals" ON public.goals;

DROP POLICY IF EXISTS "Authenticated read access" ON public.meetings;
DROP POLICY IF EXISTS "Authenticated users can manage meetings" ON public.meetings;

DROP POLICY IF EXISTS "Authenticated read access" ON public.training_plans;
DROP POLICY IF EXISTS "Authenticated users can manage training_plans" ON public.training_plans;

DROP POLICY IF EXISTS "Authenticated read access" ON public.documents;
DROP POLICY IF EXISTS "Authenticated read access" ON public.inbox_items;
DROP POLICY IF EXISTS "Authenticated read access" ON public.properties;

-- ═══════════════════════════════════════════════════════════════
-- PART 2: Fix auth_rls_initplan - Replace auth.uid() with (select auth.uid())
-- Drop and recreate policies with optimized auth calls
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- embedding_jobs
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create embedding jobs" ON public.embedding_jobs;
DROP POLICY IF EXISTS "Users can view embedding jobs" ON public.embedding_jobs;

CREATE POLICY "Users can create embedding jobs" ON public.embedding_jobs
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view embedding jobs" ON public.embedding_jobs
  FOR SELECT USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- alert_thresholds
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own alert_thresholds" ON public.alert_thresholds;
DROP POLICY IF EXISTS "Users can insert own alert_thresholds" ON public.alert_thresholds;
DROP POLICY IF EXISTS "Users can update own alert_thresholds" ON public.alert_thresholds;
DROP POLICY IF EXISTS "Users can delete own alert_thresholds" ON public.alert_thresholds;

CREATE POLICY "Users can view own alert_thresholds" ON public.alert_thresholds
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own alert_thresholds" ON public.alert_thresholds
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own alert_thresholds" ON public.alert_thresholds
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own alert_thresholds" ON public.alert_thresholds
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- body_tracking
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own body_tracking" ON public.body_tracking;
DROP POLICY IF EXISTS "Users can insert own body_tracking" ON public.body_tracking;
DROP POLICY IF EXISTS "Users can update own body_tracking" ON public.body_tracking;
DROP POLICY IF EXISTS "Users can delete own body_tracking" ON public.body_tracking;

CREATE POLICY "Users can view own body_tracking" ON public.body_tracking
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own body_tracking" ON public.body_tracking
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own body_tracking" ON public.body_tracking
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own body_tracking" ON public.body_tracking
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- cardio_sessions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own cardio_sessions" ON public.cardio_sessions;
DROP POLICY IF EXISTS "Users can insert own cardio_sessions" ON public.cardio_sessions;
DROP POLICY IF EXISTS "Users can update own cardio_sessions" ON public.cardio_sessions;
DROP POLICY IF EXISTS "Users can delete own cardio_sessions" ON public.cardio_sessions;

CREATE POLICY "Users can view own cardio_sessions" ON public.cardio_sessions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own cardio_sessions" ON public.cardio_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own cardio_sessions" ON public.cardio_sessions
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own cardio_sessions" ON public.cardio_sessions
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- documents
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

CREATE POLICY "Users can view documents" ON public.documents
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- nutrition_compliance
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own nutrition_compliance" ON public.nutrition_compliance;
DROP POLICY IF EXISTS "Users can insert own nutrition_compliance" ON public.nutrition_compliance;
DROP POLICY IF EXISTS "Users can update own nutrition_compliance" ON public.nutrition_compliance;
DROP POLICY IF EXISTS "Users can delete own nutrition_compliance" ON public.nutrition_compliance;

CREATE POLICY "Users can view own nutrition_compliance" ON public.nutrition_compliance
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own nutrition_compliance" ON public.nutrition_compliance
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own nutrition_compliance" ON public.nutrition_compliance
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own nutrition_compliance" ON public.nutrition_compliance
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- ped_trt_compliance
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own ped_trt_compliance" ON public.ped_trt_compliance;
DROP POLICY IF EXISTS "Users can insert own ped_trt_compliance" ON public.ped_trt_compliance;
DROP POLICY IF EXISTS "Users can update own ped_trt_compliance" ON public.ped_trt_compliance;
DROP POLICY IF EXISTS "Users can delete own ped_trt_compliance" ON public.ped_trt_compliance;

CREATE POLICY "Users can view own ped_trt_compliance" ON public.ped_trt_compliance
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own ped_trt_compliance" ON public.ped_trt_compliance
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own ped_trt_compliance" ON public.ped_trt_compliance
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own ped_trt_compliance" ON public.ped_trt_compliance
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- progress_photos
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can insert own progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can update own progress_photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can delete own progress_photos" ON public.progress_photos;

CREATE POLICY "Users can view own progress_photos" ON public.progress_photos
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own progress_photos" ON public.progress_photos
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own progress_photos" ON public.progress_photos
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own progress_photos" ON public.progress_photos
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- supplement_compliance
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own supplement_compliance" ON public.supplement_compliance;
DROP POLICY IF EXISTS "Users can insert own supplement_compliance" ON public.supplement_compliance;
DROP POLICY IF EXISTS "Users can update own supplement_compliance" ON public.supplement_compliance;
DROP POLICY IF EXISTS "Users can delete own supplement_compliance" ON public.supplement_compliance;

CREATE POLICY "Users can view own supplement_compliance" ON public.supplement_compliance
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own supplement_compliance" ON public.supplement_compliance
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own supplement_compliance" ON public.supplement_compliance
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own supplement_compliance" ON public.supplement_compliance
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- supplement_slots
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own supplement_slots" ON public.supplement_slots;
DROP POLICY IF EXISTS "Users can insert own supplement_slots" ON public.supplement_slots;
DROP POLICY IF EXISTS "Users can update own supplement_slots" ON public.supplement_slots;
DROP POLICY IF EXISTS "Users can delete own supplement_slots" ON public.supplement_slots;

CREATE POLICY "Users can view own supplement_slots" ON public.supplement_slots
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own supplement_slots" ON public.supplement_slots
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own supplement_slots" ON public.supplement_slots
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own supplement_slots" ON public.supplement_slots
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- training_sessions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can insert own training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can update own training_sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can delete own training_sessions" ON public.training_sessions;

CREATE POLICY "Users can view own training_sessions" ON public.training_sessions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own training_sessions" ON public.training_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own training_sessions" ON public.training_sessions
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own training_sessions" ON public.training_sessions
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- training_sets
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own training_sets" ON public.training_sets;
DROP POLICY IF EXISTS "Users can insert own training_sets" ON public.training_sets;
DROP POLICY IF EXISTS "Users can update own training_sets" ON public.training_sets;
DROP POLICY IF EXISTS "Users can delete own training_sets" ON public.training_sets;

CREATE POLICY "Users can view own training_sets" ON public.training_sets
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own training_sets" ON public.training_sets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own training_sets" ON public.training_sets
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own training_sets" ON public.training_sets
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- weekly_updates
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own weekly_updates" ON public.weekly_updates;
DROP POLICY IF EXISTS "Users can insert own weekly_updates" ON public.weekly_updates;
DROP POLICY IF EXISTS "Users can update own weekly_updates" ON public.weekly_updates;
DROP POLICY IF EXISTS "Users can delete own weekly_updates" ON public.weekly_updates;

CREATE POLICY "Users can view own weekly_updates" ON public.weekly_updates
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own weekly_updates" ON public.weekly_updates
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own weekly_updates" ON public.weekly_updates
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own weekly_updates" ON public.weekly_updates
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- solar_panels
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own solar panels" ON public.solar_panels;
DROP POLICY IF EXISTS "Users can insert their own solar panels" ON public.solar_panels;
DROP POLICY IF EXISTS "Users can update their own solar panels" ON public.solar_panels;
DROP POLICY IF EXISTS "Users can delete their own solar panels" ON public.solar_panels;

CREATE POLICY "Users can view their own solar panels" ON public.solar_panels
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own solar panels" ON public.solar_panels
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own solar panels" ON public.solar_panels
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own solar panels" ON public.solar_panels
  FOR DELETE USING (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- user_preferences
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- daily_supplement_tracking
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own supplements" ON public.daily_supplement_tracking;

CREATE POLICY "Users can manage own supplements" ON public.daily_supplement_tracking
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- asset_loans
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own asset_loans" ON public.asset_loans;

CREATE POLICY "Users can manage their own asset_loans" ON public.asset_loans
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- daily_habit_logs
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own daily_habit_logs" ON public.daily_habit_logs;

CREATE POLICY "Users can manage their own daily_habit_logs" ON public.daily_habit_logs
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- daily_outcomes
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own daily_outcomes" ON public.daily_outcomes;

CREATE POLICY "Users can manage their own daily_outcomes" ON public.daily_outcomes
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- event_tags
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own event_tags" ON public.event_tags;

CREATE POLICY "Users can manage their own event_tags" ON public.event_tags
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- fitness_habit_logs
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own fitness_habit_logs" ON public.fitness_habit_logs;

CREATE POLICY "Users can manage their own fitness_habit_logs" ON public.fitness_habit_logs
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- fitness_habits
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own fitness_habits" ON public.fitness_habits;

CREATE POLICY "Users can manage their own fitness_habits" ON public.fitness_habits
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- goals
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.goals;

CREATE POLICY "Users can manage their own goals" ON public.goals
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- habit_definitions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own habit_definitions" ON public.habit_definitions;

CREATE POLICY "Users can manage their own habit_definitions" ON public.habit_definitions
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- habit_streaks
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own habit_streaks" ON public.habit_streaks;

CREATE POLICY "Users can manage their own habit_streaks" ON public.habit_streaks
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- inbox_items
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own inbox_items" ON public.inbox_items;

CREATE POLICY "Users can manage their own inbox_items" ON public.inbox_items
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- meetings
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own meetings" ON public.meetings;

CREATE POLICY "Users can manage their own meetings" ON public.meetings
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- points_history
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own points_history" ON public.points_history;

CREATE POLICY "Users can manage their own points_history" ON public.points_history
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- properties
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own properties" ON public.properties;

CREATE POLICY "Users can manage their own properties" ON public.properties
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- supplement_peptide_log
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own supplement_peptide_log" ON public.supplement_peptide_log;

CREATE POLICY "Users can manage their own supplement_peptide_log" ON public.supplement_peptide_log
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- training_plans
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own training_plans" ON public.training_plans;

CREATE POLICY "Users can manage their own training_plans" ON public.training_plans
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- user_stats
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own user_stats" ON public.user_stats;

CREATE POLICY "Users can manage their own user_stats" ON public.user_stats
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- weekly_time_categories
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own weekly_time_categories" ON public.weekly_time_categories;

CREATE POLICY "Users can manage their own weekly_time_categories" ON public.weekly_time_categories
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- PART 3: Remove duplicate indexes
-- ═══════════════════════════════════════════════════════════════

-- Keep the trigram indexes (more useful for text search), drop the basic ones
DROP INDEX IF EXISTS idx_documents_title;
DROP INDEX IF EXISTS idx_inbox_items_title;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION COMMENT
-- ═══════════════════════════════════════════════════════════════
-- After running this migration, re-run the Supabase linter to verify
-- all auth_rls_initplan and multiple_permissive_policies warnings are resolved.
--
-- To verify manually:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
