-- ═══════════════════════════════════════════════════════════════
-- Life OS - Wealth Module Schema
-- Migration: 00002_wealth_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Contacts (Alle Ansprechpartner)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_type VARCHAR(50) NOT NULL, -- hausverwalter, handwerker, steuerberater, bank_berater, versicherung, notar, makler, sonstige
    company_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('contacts');
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);

-- ───────────────────────────────────────────────────────────────
-- Contact Specialties (Handwerker-Spezialisierungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE contact_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL, -- elektro, sanitaer, heizung, maler, dach, garten, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_specialties_contact ON contact_specialties(contact_id);
CREATE INDEX idx_contact_specialties_specialty ON contact_specialties(specialty);

-- ───────────────────────────────────────────────────────────────
-- Banks (Banken-Stammdaten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bic VARCHAR(20),
    contact_id UUID REFERENCES contacts(id), -- Bankberater
    online_banking_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('banks');

-- ───────────────────────────────────────────────────────────────
-- Accounts (Bankkonten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    iban VARCHAR(34),
    bank_id UUID REFERENCES banks(id),
    account_type VARCHAR(50) NOT NULL, -- giro, tagesgeld, festgeld, depot, darlehen, ruecklage, mietkautionen, privat
    property_id UUID, -- Will be linked after properties table is created
    purpose VARCHAR(255),
    current_balance DECIMAL(14,2) DEFAULT 0,
    bhb_account_id VARCHAR(100), -- Buchhaltungsbutler ID
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('accounts');
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_bank ON accounts(bank_id);

-- ───────────────────────────────────────────────────────────────
-- Properties (Immobilien)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    property_type VARCHAR(50), -- MFH, EFH, ETW
    is_self_occupied BOOLEAN DEFAULT FALSE,
    unit_count INTEGER DEFAULT 1,
    property_manager_id UUID REFERENCES contacts(id),
    utility_billing_type VARCHAR(50), -- selbst, hausverwaltung, eigene_firma
    primary_account_id UUID REFERENCES accounts(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('properties');
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);

-- Add foreign key from accounts to properties
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_property
    FOREIGN KEY (property_id) REFERENCES properties(id);
CREATE INDEX idx_accounts_property ON accounts(property_id);

-- ───────────────────────────────────────────────────────────────
-- Contact Properties (n:m Zuordnung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE contact_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    role VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contact_id, property_id)
);

CREATE INDEX idx_contact_properties_contact ON contact_properties(contact_id);
CREATE INDEX idx_contact_properties_property ON contact_properties(property_id);

-- ───────────────────────────────────────────────────────────────
-- Tenants (Mieter)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    contract_start DATE,
    contract_end DATE, -- NULL = unbefristet
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_account_id UUID REFERENCES accounts(id),
    status VARCHAR(50) DEFAULT 'aktiv', -- aktiv, gekündigt, ausgezogen
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('tenants');
CREATE INDEX idx_tenants_status ON tenants(status);

-- ───────────────────────────────────────────────────────────────
-- Units (Wohneinheiten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50),
    floor INTEGER,
    size_sqm DECIMAL(8,2),
    rooms DECIMAL(3,1),
    monthly_rent_cold DECIMAL(10,2),
    monthly_utilities_advance DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'vermietet', -- vermietet, leer, eigennutzung, renovierung
    current_tenant_id UUID REFERENCES tenants(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('units');
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_tenant ON units(current_tenant_id);

-- Add unit_id to tenants (circular reference)
ALTER TABLE tenants ADD COLUMN unit_id UUID REFERENCES units(id);
CREATE INDEX idx_tenants_unit ON tenants(unit_id);

-- ───────────────────────────────────────────────────────────────
-- Loans (Darlehen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    bank_id UUID REFERENCES banks(id),
    account_id UUID REFERENCES accounts(id),
    loan_number VARCHAR(100),
    loan_type VARCHAR(50), -- annuitaet, endfaellig, kfw, tilgungsaussetzung

    -- Beträge
    original_amount DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2),
    disbursed_amount DECIMAL(12,2),

    -- Zinsen
    interest_rate_nominal DECIMAL(5,3),
    interest_rate_effective DECIMAL(5,3),
    interest_fixed_from DATE,
    interest_fixed_until DATE,
    interest_type VARCHAR(20), -- fest, variabel

    -- Tilgung & Annuität
    initial_repayment_rate DECIMAL(5,3),
    monthly_payment DECIMAL(10,2),
    annual_annuity DECIMAL(12,2),
    payment_day INTEGER,

    -- Sondertilgung
    special_repayment_allowed BOOLEAN DEFAULT FALSE,
    special_repayment_percent DECIMAL(5,2),
    special_repayment_used_this_year DECIMAL(12,2) DEFAULT 0,

    -- Laufzeit
    start_date DATE,
    end_date DATE,
    remaining_term_months INTEGER,

    -- Sicherheiten
    collateral_type VARCHAR(50),
    collateral_amount DECIMAL(12,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('loans');
CREATE INDEX idx_loans_property ON loans(property_id);
CREATE INDEX idx_loans_bank ON loans(bank_id);
CREATE INDEX idx_loans_interest_fixed_until ON loans(interest_fixed_until);

-- ───────────────────────────────────────────────────────────────
-- Loan Schedule (Tilgungsplan)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE loan_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    payment_number INTEGER,
    opening_balance DECIMAL(12,2),
    interest_portion DECIMAL(10,2),
    principal_portion DECIMAL(10,2),
    total_payment DECIMAL(10,2),
    closing_balance DECIMAL(12,2),
    is_special_repayment BOOLEAN DEFAULT FALSE,
    is_actual BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_schedule_loan ON loan_schedule(loan_id);
CREATE INDEX idx_loan_schedule_date ON loan_schedule(payment_date);

-- ───────────────────────────────────────────────────────────────
-- Loan Scenarios (Anschlussfinanzierung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE loan_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    new_interest_rate DECIMAL(5,3),
    new_monthly_payment DECIMAL(10,2),
    remaining_term_months INTEGER,
    total_interest_cost DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_scenarios_loan ON loan_scenarios(loan_id);

-- ───────────────────────────────────────────────────────────────
-- Property Scenarios (Planspiele)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50),

    target_date DATE,
    holding_period_years DECIMAL(4,1),
    is_tax_free BOOLEAN,

    estimated_sale_price DECIMAL(12,2),
    sale_costs_percent DECIMAL(5,2),
    remaining_loan_balance DECIMAL(12,2),
    capital_gains_tax DECIMAL(12,2),
    net_proceeds DECIMAL(12,2),

    total_invested DECIMAL(12,2),
    total_rental_income DECIMAL(12,2),
    total_costs DECIMAL(12,2),
    total_profit DECIMAL(12,2),
    roi_percent DECIMAL(8,2),
    irr_percent DECIMAL(8,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('property_scenarios');
CREATE INDEX idx_property_scenarios_property ON property_scenarios(property_id);

-- ───────────────────────────────────────────────────────────────
-- Property Milestones (Wichtige Termine)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL,
    target_date DATE NOT NULL,
    is_reached BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_milestones_property ON property_milestones(property_id);
CREATE INDEX idx_property_milestones_date ON property_milestones(target_date);

-- ───────────────────────────────────────────────────────────────
-- Property Tax Data (Steuer-Daten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_tax_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    building_value DECIMAL(12,2),
    land_value DECIMAL(12,2),
    afa_rate DECIMAL(4,2),
    afa_annual DECIMAL(10,2),
    afa_remaining DECIMAL(12,2),
    afa_start_date DATE,

    renovation_costs_deductible DECIMAL(12,2),
    renovation_afa_rate DECIMAL(4,2),

    annual_interest_deductible DECIMAL(10,2),
    annual_maintenance_deductible DECIMAL(10,2),
    annual_management_fees DECIMAL(10,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('property_tax_data');
CREATE INDEX idx_property_tax_data_property ON property_tax_data(property_id);

-- ───────────────────────────────────────────────────────────────
-- Transactions (Buchungen aus BHB)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bhb_transaction_id VARCHAR(100) UNIQUE,
    account_id UUID REFERENCES accounts(id),
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    counterparty VARCHAR(255),
    is_rental_income BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);

-- ───────────────────────────────────────────────────────────────
-- Invoices (Rechnungen aus GMI)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmi_document_id VARCHAR(100) UNIQUE,
    property_id UUID REFERENCES properties(id),
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    vat_amount DECIMAL(10,2),
    due_date DATE,
    payment_status VARCHAR(50),
    category VARCHAR(100),
    pdf_url TEXT,
    matched_transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- ───────────────────────────────────────────────────────────────
-- Companies (Firmenbeteiligungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_form VARCHAR(50),
    industry VARCHAR(100),
    your_share_percent DECIMAL(5,2),
    total_company_value DECIMAL(12,2),
    your_share_value DECIMAL(12,2),
    employees_count INTEGER,
    annual_revenue DECIMAL(12,2),
    annual_profit DECIMAL(12,2),
    is_property_related BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('companies');

-- ───────────────────────────────────────────────────────────────
-- Portfolios (Depots)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    broker VARCHAR(100),
    account_id UUID REFERENCES accounts(id),
    api_connected BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('portfolios');

-- ───────────────────────────────────────────────────────────────
-- Positions (Investment-Positionen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    isin VARCHAR(20),
    symbol VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50),
    quantity DECIMAL(18,8),
    avg_buy_price DECIMAL(12,4),
    current_price DECIMAL(12,4),
    total_invested DECIMAL(12,2),
    current_value DECIMAL(12,2),
    unrealized_gain_loss DECIMAL(12,2),
    last_updated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_isin ON positions(isin);

-- ───────────────────────────────────────────────────────────────
-- Position History (Kursverlauf)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price DECIMAL(12,4),
    value DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_position_history_position ON position_history(position_id);
CREATE INDEX idx_position_history_date ON position_history(date);

-- ───────────────────────────────────────────────────────────────
-- Savings Plans (Sparpläne)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE savings_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id),
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20),
    execution_day INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('savings_plans');
CREATE INDEX idx_savings_plans_portfolio ON savings_plans(portfolio_id);

-- ───────────────────────────────────────────────────────────────
-- Daily Snapshots (Tägliche Vermögensübersicht)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE daily_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_assets DECIMAL(14,2),
    total_liabilities DECIMAL(14,2),
    net_worth DECIMAL(14,2),
    cash_value DECIMAL(14,2),
    investment_value DECIMAL(14,2),
    property_value DECIMAL(14,2),
    company_value DECIMAL(14,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date);

-- ───────────────────────────────────────────────────────────────
-- Recurring Transactions (Wiederkehrende Buchungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20),
    frequency VARCHAR(20),
    day_of_month INTEGER,
    account_id UUID REFERENCES accounts(id),
    property_id UUID REFERENCES properties(id),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    next_occurrence DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('recurring_transactions');

-- ───────────────────────────────────────────────────────────────
-- Cashflow Forecast (Liquiditätsplanung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE cashflow_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    forecast_type VARCHAR(20),
    expected_rent DECIMAL(12,2),
    expected_other_income DECIMAL(12,2),
    expected_loan_payments DECIMAL(12,2),
    expected_utilities DECIMAL(12,2),
    expected_insurance DECIMAL(12,2),
    expected_maintenance DECIMAL(12,2),
    expected_other_expenses DECIMAL(12,2),
    expected_net_cashflow DECIMAL(12,2),
    cumulative_balance DECIMAL(14,2),
    scenario VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cashflow_forecast_date ON cashflow_forecast(date);
CREATE INDEX idx_cashflow_forecast_scenario ON cashflow_forecast(scenario);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

-- Enable RLS on all wealth tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tax_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_forecast ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON contact_specialties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON banks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON properties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON contact_properties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON units FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loan_schedule FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loan_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_milestones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_tax_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON portfolios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON positions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON position_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON savings_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON daily_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON recurring_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON cashflow_forecast FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read all wealth data (single-user app)
CREATE POLICY "Authenticated read access" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON contact_specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON contact_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON loan_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON loan_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON property_scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON property_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON property_tax_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON position_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON savings_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON daily_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON recurring_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON cashflow_forecast FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- Ende Wealth Schema
-- ═══════════════════════════════════════════════════════════════
