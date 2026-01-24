-- ═══════════════════════════════════════════════════════════════
-- Life OS - Initial Schema
-- Migration: 00001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Extensions
-- ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Für Textsuche
CREATE EXTENSION IF NOT EXISTS "vector";        -- Für Embeddings

-- ───────────────────────────────────────────────────────────────
-- Helper Functions
-- ───────────────────────────────────────────────────────────────

-- Trigger Funktion für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Funktion um updated_at Trigger zu erstellen
CREATE OR REPLACE FUNCTION create_updated_at_trigger(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────
-- Sync Status (für alle Integrationen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL UNIQUE, -- bhb, gmi, garmin, todo, outlook
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20), -- success, error
    items_synced INTEGER DEFAULT 0,
    errors JSONB,
    next_scheduled_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('sync_status');

-- ───────────────────────────────────────────────────────────────
-- Audit Logs
-- ───────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(20) NOT NULL, -- create, read, update, delete
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    source VARCHAR(50) -- web, telegram, n8n, api
);

-- Index für schnelle Abfragen
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ───────────────────────────────────────────────────────────────
-- User Preferences (zusätzlich zu Supabase Auth)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Allgemein
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    locale VARCHAR(10) DEFAULT 'de-DE',
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Dashboard
    default_dashboard_view VARCHAR(50) DEFAULT 'today',
    
    -- Notifications
    telegram_chat_id BIGINT,
    email_notifications BOOLEAN DEFAULT TRUE,
    telegram_notifications BOOLEAN DEFAULT TRUE,
    
    -- FIRE Settings
    fire_target_amount DECIMAL(14,2),
    fire_withdrawal_rate DECIMAL(5,2) DEFAULT 4.0,
    fire_monthly_expenses DECIMAL(10,2),
    
    -- Health
    protein_target_g DECIMAL(6,1) DEFAULT 180,
    calorie_target INTEGER DEFAULT 2500,
    sleep_target_hours DECIMAL(3,1) DEFAULT 8,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('user_preferences');

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

-- Sync Status: Nur für Service Role
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sync_status"
ON sync_status
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Audit Logs: Nur lesen für authenticated, schreiben für service
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert audit logs"
ON audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- User Preferences: Nur eigene Daten
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
ON user_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────
-- Initial Sync Status Records
-- ───────────────────────────────────────────────────────────────
INSERT INTO sync_status (source) VALUES
    ('buchhaltungsbutler'),
    ('getmyinvoices'),
    ('garmin'),
    ('microsoft_todo'),
    ('outlook');

-- ───────────────────────────────────────────────────────────────
-- Helpful Views
-- ───────────────────────────────────────────────────────────────

-- View: Alle Sync Status mit Alter
CREATE VIEW v_sync_status AS
SELECT 
    source,
    last_sync_at,
    last_sync_status,
    items_synced,
    EXTRACT(EPOCH FROM (NOW() - last_sync_at)) / 3600 AS hours_since_sync,
    CASE 
        WHEN last_sync_at IS NULL THEN 'never'
        WHEN last_sync_status = 'error' THEN 'error'
        WHEN NOW() - last_sync_at > INTERVAL '24 hours' THEN 'stale'
        ELSE 'ok'
    END AS status
FROM sync_status;

-- ═══════════════════════════════════════════════════════════════
-- Ende Initial Schema
-- ═══════════════════════════════════════════════════════════════
