-- ═══════════════════════════════════════════════════════════════
-- Migration: Index Foreign Keys
-- Description: Adds indexes on foreign key columns to improve JOIN performance
-- Date: 2026-01-29
--
-- Addresses 22 unindexed_foreign_keys warnings from Supabase linter
-- ═══════════════════════════════════════════════════════════════

-- banks.contact_id
CREATE INDEX IF NOT EXISTS idx_banks_contact_id ON public.banks(contact_id);

-- company_financials.document_id
CREATE INDEX IF NOT EXISTS idx_company_financials_document_id ON public.company_financials(document_id);

-- daily_logs.nutrition_id
CREATE INDEX IF NOT EXISTS idx_daily_logs_nutrition_id ON public.daily_logs(nutrition_id);

-- embedding_jobs.chunking_config_id
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_chunking_config_id ON public.embedding_jobs(chunking_config_id);

-- goals.user_id
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- inbox_items.contact_id
CREATE INDEX IF NOT EXISTS idx_inbox_items_contact_id ON public.inbox_items(contact_id);

-- inbox_items.goal_id
CREATE INDEX IF NOT EXISTS idx_inbox_items_goal_id ON public.inbox_items(goal_id);

-- invoices.matched_transaction_id
CREATE INDEX IF NOT EXISTS idx_invoices_matched_transaction_id ON public.invoices(matched_transaction_id);

-- loans.account_id
CREATE INDEX IF NOT EXISTS idx_loans_account_id ON public.loans(account_id);

-- meetings.user_id
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);

-- portfolios.account_id
CREATE INDEX IF NOT EXISTS idx_portfolios_account_id ON public.portfolios(account_id);

-- properties.primary_account_id
CREATE INDEX IF NOT EXISTS idx_properties_primary_account_id ON public.properties(primary_account_id);

-- properties.property_manager_id
CREATE INDEX IF NOT EXISTS idx_properties_property_manager_id ON public.properties(property_manager_id);

-- property_technical_status.property_id
CREATE INDEX IF NOT EXISTS idx_property_technical_status_property_id ON public.property_technical_status(property_id);

-- savings_plans.position_id
CREATE INDEX IF NOT EXISTS idx_savings_plans_position_id ON public.savings_plans(position_id);

-- tenant_changes.unit_id
CREATE INDEX IF NOT EXISTS idx_tenant_changes_unit_id ON public.tenant_changes(unit_id);

-- tenants.deposit_account_id
CREATE INDEX IF NOT EXISTS idx_tenants_deposit_account_id ON public.tenants(deposit_account_id);

-- training_sessions.training_plan_id
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_plan_id ON public.training_sessions(training_plan_id);

-- transactions.unit_id
CREATE INDEX IF NOT EXISTS idx_transactions_unit_id ON public.transactions(unit_id);
