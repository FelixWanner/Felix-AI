-- ═══════════════════════════════════════════════════════════════
-- Life OS - Real Estate Dashboard Schema
-- Migration: 00016_real_estate_dashboard.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Schema-Erweiterungen (bestehende Tabellen)
-- ───────────────────────────────────────────────────────────────

-- Properties: Konservativer Marktwert und Gesamtfläche
ALTER TABLE properties ADD COLUMN IF NOT EXISTS conservative_market_value DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_sqm DECIMAL(10,2);

-- Units: Soll-/Marktmiete
ALTER TABLE units ADD COLUMN IF NOT EXISTS market_rent_cold DECIMAL(10,2);

-- ───────────────────────────────────────────────────────────────
-- Property Operating Data (Monatliche Betriebsdaten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_operating_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- Erster Tag des Monats

    -- Mieteinnahmen
    actual_cold_rent DECIMAL(10,2),           -- Ist-Kaltmiete
    target_cold_rent DECIMAL(10,2),           -- Soll-/Marktmiete
    vacancy_days INTEGER DEFAULT 0,            -- Leerstandstage
    rent_arrears DECIMAL(10,2) DEFAULT 0,      -- Mietrückstände

    -- Betriebskosten
    allocable_costs DECIMAL(10,2),             -- Umlagefähige Nebenkosten
    non_allocable_costs DECIMAL(10,2),         -- Nicht umlagefähige Nebenkosten

    -- Instandhaltung & CapEx
    maintenance_actual DECIMAL(10,2),          -- Instandhaltung Ist
    maintenance_planned DECIMAL(10,2),         -- Instandhaltung geplant
    capex_actual DECIMAL(10,2),                -- CapEx Ist
    capex_planned DECIMAL(10,2),               -- CapEx geplant/Budget

    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id, month)
);

SELECT create_updated_at_trigger('property_operating_data');
CREATE INDEX idx_property_operating_data_property ON property_operating_data(property_id);
CREATE INDEX idx_property_operating_data_month ON property_operating_data(month DESC);
CREATE INDEX idx_property_operating_data_user ON property_operating_data(user_id);

-- ───────────────────────────────────────────────────────────────
-- Property Technical Status (Technischer Zustand - Ampelsystem)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_technical_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Heizung
    heating_status VARCHAR(20) DEFAULT 'green' CHECK (heating_status IN ('green', 'yellow', 'red')),
    heating_type VARCHAR(100),
    heating_year INTEGER,
    heating_notes TEXT,

    -- Dach
    roof_status VARCHAR(20) DEFAULT 'green' CHECK (roof_status IN ('green', 'yellow', 'red')),
    roof_type VARCHAR(100),
    roof_year INTEGER,
    roof_notes TEXT,

    -- Feuchtigkeit
    moisture_status VARCHAR(20) DEFAULT 'green' CHECK (moisture_status IN ('green', 'yellow', 'red')),
    moisture_notes TEXT,

    -- Elektrik
    electrical_status VARCHAR(20) DEFAULT 'green' CHECK (electrical_status IN ('green', 'yellow', 'red')),
    electrical_year INTEGER,
    electrical_notes TEXT,

    -- Sanitär
    plumbing_status VARCHAR(20) DEFAULT 'green' CHECK (plumbing_status IN ('green', 'yellow', 'red')),
    plumbing_year INTEGER,
    plumbing_notes TEXT,

    -- Fassade
    facade_status VARCHAR(20) DEFAULT 'green' CHECK (facade_status IN ('green', 'yellow', 'red')),
    facade_year INTEGER,
    facade_notes TEXT,

    -- Fenster
    windows_status VARCHAR(20) DEFAULT 'green' CHECK (windows_status IN ('green', 'yellow', 'red')),
    windows_year INTEGER,
    windows_notes TEXT,

    -- Inspektionen
    last_inspection_date DATE,
    next_inspection_due DATE,

    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(property_id)
);

SELECT create_updated_at_trigger('property_technical_status');
CREATE INDEX idx_property_technical_status_property ON property_technical_status(property_id);

-- ───────────────────────────────────────────────────────────────
-- Tenant Changes (Mieterwechsel-Historie)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tenant_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('move_in', 'move_out', 'rent_increase', 'rent_decrease')),
    change_date DATE NOT NULL,

    previous_tenant_id UUID REFERENCES tenants(id),
    new_tenant_id UUID REFERENCES tenants(id),

    previous_rent DECIMAL(10,2),
    new_rent DECIMAL(10,2),

    vacancy_days_before INTEGER, -- Tage Leerstand vor Neuvermietung
    notes TEXT,

    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_changes_unit ON tenant_changes(unit_id);
CREATE INDEX idx_tenant_changes_property ON tenant_changes(property_id);
CREATE INDEX idx_tenant_changes_date ON tenant_changes(change_date DESC);
CREATE INDEX idx_tenant_changes_type ON tenant_changes(change_type);

-- ───────────────────────────────────────────────────────────────
-- Alert Thresholds (Konfigurierbare Schwellenwerte)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE alert_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),

    -- DSCR (Debt Service Coverage Ratio)
    dscr_warning DECIMAL(4,2) DEFAULT 1.2,
    dscr_critical DECIMAL(4,2) DEFAULT 1.1,

    -- Zinsbindung (Monate)
    interest_expiry_warning_months INTEGER DEFAULT 24,
    interest_expiry_critical_months INTEGER DEFAULT 18,
    ltv_high_threshold DECIMAL(5,2) DEFAULT 80, -- LTV % ab dem Refinanzierung kritisch wird

    -- Mietrückstände (als Anteil der Monatsmiete)
    arrears_warning_months DECIMAL(4,2) DEFAULT 0.5,
    arrears_critical_months DECIMAL(4,2) DEFAULT 1.0,

    -- Leerstand (Tage)
    vacancy_warning_days INTEGER DEFAULT 30,
    vacancy_critical_days INTEGER DEFAULT 60,

    -- CapEx-Budget (Prozent verbraucht)
    capex_warning_percent INTEGER DEFAULT 70,
    capex_critical_percent INTEGER DEFAULT 90,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

SELECT create_updated_at_trigger('alert_thresholds');

-- ───────────────────────────────────────────────────────────────
-- Portfolio Snapshots (Historische KPI-Snapshots)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    snapshot_date DATE NOT NULL,

    -- Kernwerte
    total_property_value DECIMAL(14,2),
    total_loan_balance DECIMAL(14,2),
    total_equity DECIMAL(14,2),
    portfolio_ltv DECIMAL(6,2),

    -- Einkommen
    total_actual_rent DECIMAL(12,2),
    total_target_rent DECIMAL(12,2),
    total_non_allocable_costs DECIMAL(12,2),
    total_debt_service DECIMAL(12,2),
    net_operating_income DECIMAL(12,2),
    net_cashflow DECIMAL(12,2),

    -- Kennzahlen
    dscr DECIMAL(6,3),
    vacancy_rate_units DECIMAL(6,2),
    vacancy_rate_sqm DECIMAL(6,2),
    arrears_rate DECIMAL(6,2),

    -- CapEx
    total_capex_actual DECIMAL(12,2),
    total_capex_planned DECIMAL(12,2),

    -- Einheiten
    total_units INTEGER,
    occupied_units INTEGER,
    total_sqm DECIMAL(12,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

-- Enable RLS on all new tables
ALTER TABLE property_operating_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_technical_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON property_operating_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_technical_status FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON tenant_changes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON alert_thresholds FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON portfolio_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read all data (single-user app)
CREATE POLICY "Authenticated read access" ON property_operating_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON property_technical_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON tenant_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON alert_thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON portfolio_snapshots FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert/update/delete their own data
CREATE POLICY "Authenticated write access" ON property_operating_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON property_operating_data FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete access" ON property_operating_data FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated write access" ON property_technical_status FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON property_technical_status FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete access" ON property_technical_status FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated write access" ON tenant_changes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON tenant_changes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete access" ON tenant_changes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated write access" ON alert_thresholds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON alert_thresholds FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete access" ON alert_thresholds FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated write access" ON portfolio_snapshots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update access" ON portfolio_snapshots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete access" ON portfolio_snapshots FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- Ende Real Estate Dashboard Schema
-- ═══════════════════════════════════════════════════════════════
