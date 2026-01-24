-- ═══════════════════════════════════════════════════════════════
-- Life OS - Wealth Module Schema
-- Migration: 00002_wealth_module.sql
-- ═══════════════════════════════════════════════════════════════
-- Immobilien, Konten, Darlehen, Investments, Finanzen
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. BANKS (Banken-Stammdaten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bic VARCHAR(20),
    contact_id UUID, -- FK wird später hinzugefügt (circular dependency)
    online_banking_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('banks');

-- ───────────────────────────────────────────────────────────────
-- 2. CONTACTS (Alle Ansprechpartner)
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

-- Jetzt FK für banks.contact_id hinzufügen
ALTER TABLE banks ADD CONSTRAINT fk_banks_contact
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- 3. CONTACT_SPECIALTIES (Handwerker-Spezialisierungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE contact_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL, -- elektro, sanitaer, heizung, maler, dach, garten, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 4. PROPERTIES (Immobilien)
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
    property_manager_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    utility_billing_type VARCHAR(50), -- selbst, hausverwaltung, eigene_firma
    primary_account_id UUID, -- FK wird später hinzugefügt
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('properties');

-- ───────────────────────────────────────────────────────────────
-- 5. CONTACT_PROPERTIES (n:m Zuordnung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE contact_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    role VARCHAR(100), -- z.B. "Hauptansprechpartner"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contact_id, property_id)
);

-- ───────────────────────────────────────────────────────────────
-- 6. ACCOUNTS (Bankkonten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    iban VARCHAR(34),
    bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
    account_type VARCHAR(50) NOT NULL, -- giro, tagesgeld, festgeld, depot, darlehen, ruecklage, mietkautionen, privat
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    purpose VARCHAR(255), -- z.B. "Mieteinnahmen Haus A"
    current_balance DECIMAL(14,2) DEFAULT 0,
    bhb_account_id VARCHAR(100), -- Buchhaltungsbutler ID
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('accounts');

-- Jetzt FK für properties.primary_account_id hinzufügen
ALTER TABLE properties ADD CONSTRAINT fk_properties_primary_account
    FOREIGN KEY (primary_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- 7. UNITS (Wohneinheiten)
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
    current_tenant_id UUID, -- FK wird später hinzugefügt
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('units');

-- ───────────────────────────────────────────────────────────────
-- 8. TENANTS (Mieter)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    contract_start DATE,
    contract_end DATE, -- NULL = unbefristet
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'aktiv', -- aktiv, gekündigt, ausgezogen
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('tenants');

-- Jetzt FK für units.current_tenant_id hinzufügen
ALTER TABLE units ADD CONSTRAINT fk_units_current_tenant
    FOREIGN KEY (current_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- 9. LOANS (Darlehen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    loan_number VARCHAR(100),
    loan_type VARCHAR(50), -- annuitaet, endfaellig, kfw, tilgungsaussetzung

    -- Beträge
    original_amount DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2),
    disbursed_amount DECIMAL(12,2),

    -- Zinsen
    interest_rate_nominal DECIMAL(5,3), -- Sollzins p.a.
    interest_rate_effective DECIMAL(5,3), -- Effektivzins p.a.
    interest_fixed_from DATE,
    interest_fixed_until DATE, -- SOLLZINSBINDUNG BIS
    interest_type VARCHAR(20), -- fest, variabel

    -- Tilgung & Annuität
    initial_repayment_rate DECIMAL(5,3), -- Anfängliche Tilgung %
    monthly_payment DECIMAL(10,2), -- Monatliche Annuität
    annual_annuity DECIMAL(12,2), -- Jahresannuität
    payment_day INTEGER, -- Abbuchungstag (1-31)

    -- Sondertilgung
    special_repayment_allowed BOOLEAN DEFAULT FALSE,
    special_repayment_percent DECIMAL(5,2), -- z.B. 5% p.a.
    special_repayment_used_this_year DECIMAL(12,2) DEFAULT 0,

    -- Laufzeit
    start_date DATE,
    end_date DATE,
    remaining_term_months INTEGER,

    -- Sicherheiten
    collateral_type VARCHAR(50), -- grundschuld, hypothek
    collateral_amount DECIMAL(12,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('loans');

-- ───────────────────────────────────────────────────────────────
-- 10. LOAN_SCHEDULE (Tilgungsplan)
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
    is_actual BOOLEAN DEFAULT FALSE, -- True = tatsächlich, False = Plan
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 11. LOAN_SCENARIOS (Anschlussfinanzierung-Szenarien)
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

-- ───────────────────────────────────────────────────────────────
-- 12. PROPERTY_SCENARIOS (Immobilien-Planspiele)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50), -- verkauf_steuerfrei, verkauf_steuerpflichtig, refinanzierung, sanierung, umnutzung, mietsteigerung, leerstand_simulation

    -- Zeitrahmen
    target_date DATE,
    holding_period_years DECIMAL(4,1),
    is_tax_free BOOLEAN, -- True wenn > 10 Jahre

    -- Verkaufsszenario
    estimated_sale_price DECIMAL(12,2),
    sale_costs_percent DECIMAL(5,2), -- Makler, Notar: 8-10%
    remaining_loan_balance DECIMAL(12,2),
    capital_gains_tax DECIMAL(12,2), -- Spekulationssteuer
    net_proceeds DECIMAL(12,2), -- Nettoerlös

    -- ROI-Berechnung
    total_invested DECIMAL(12,2), -- Kaufpreis + Sanierung + NK
    total_rental_income DECIMAL(12,2), -- Kumulierte Mieteinnahmen
    total_costs DECIMAL(12,2), -- Zinsen + Instandhaltung + ...
    total_profit DECIMAL(12,2),
    roi_percent DECIMAL(8,2),
    irr_percent DECIMAL(8,2), -- Interner Zinsfuß

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('property_scenarios');

-- ───────────────────────────────────────────────────────────────
-- 13. PROPERTY_MILESTONES (Wichtige Termine)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL, -- kaufdatum, 10_jahre_steuerfrei, zinsbindung_ende, darlehen_getilgt, sanierung_faellig
    target_date DATE NOT NULL,
    is_reached BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 14. PROPERTY_TAX_DATA (Steuer-Daten)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE property_tax_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- AfA
    building_value DECIMAL(12,2),
    land_value DECIMAL(12,2),
    afa_rate DECIMAL(4,2), -- 2% oder 2.5%
    afa_annual DECIMAL(10,2),
    afa_remaining DECIMAL(12,2),
    afa_start_date DATE,

    -- Sanierung
    renovation_costs_deductible DECIMAL(12,2),
    renovation_afa_rate DECIMAL(4,2),

    -- Werbungskosten
    annual_interest_deductible DECIMAL(10,2),
    annual_maintenance_deductible DECIMAL(10,2),
    annual_management_fees DECIMAL(10,2),

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('property_tax_data');

-- ───────────────────────────────────────────────────────────────
-- 15. TRANSACTIONS (Buchungen aus BHB)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bhb_transaction_id VARCHAR(100) UNIQUE, -- Buchhaltungsbutler ID
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
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

-- ───────────────────────────────────────────────────────────────
-- 16. INVOICES (Rechnungen aus GMI)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmi_document_id VARCHAR(100) UNIQUE, -- GetMyInvoices ID
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    amount DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    vat_amount DECIMAL(10,2),
    due_date DATE,
    payment_status VARCHAR(50), -- offen, bezahlt, ueberfaellig
    category VARCHAR(100),
    pdf_url TEXT,
    matched_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 17. COMPANIES (Firmenbeteiligungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_form VARCHAR(50), -- GmbH, UG, GbR, etc.
    industry VARCHAR(100),
    your_share_percent DECIMAL(5,2), -- z.B. 33.33%
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
-- 18. COMPANY_FINANCIALS (Jahresabschlüsse)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE company_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    revenue DECIMAL(12,2),
    expenses DECIMAL(12,2),
    profit DECIMAL(12,2),
    your_distribution DECIMAL(12,2),
    document_id UUID, -- FK zu documents wird später hinzugefügt (andere Migration)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 19. PORTFOLIOS (Depots)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    broker VARCHAR(100), -- trade_republic, scalable, ing, etc.
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    api_connected BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('portfolios');

-- ───────────────────────────────────────────────────────────────
-- 20. POSITIONS (Investment-Positionen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    isin VARCHAR(20),
    symbol VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50), -- etf, aktie, anleihe, krypto
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

-- ───────────────────────────────────────────────────────────────
-- 21. POSITION_HISTORY (Kursverlauf)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price DECIMAL(12,4),
    value DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 22. SAVINGS_PLANS (Sparpläne)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE savings_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20), -- monatlich, quartalsweise
    execution_day INTEGER, -- 1-28
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('savings_plans');

-- ───────────────────────────────────────────────────────────────
-- 23. DAILY_SNAPSHOTS (Tägliche Vermögensübersicht)
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

-- ───────────────────────────────────────────────────────────────
-- 24. RECURRING_TRANSACTIONS (Wiederkehrende Buchungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20), -- income, expense
    frequency VARCHAR(20), -- monthly, quarterly, yearly
    day_of_month INTEGER,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    next_occurrence DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('recurring_transactions');

-- ───────────────────────────────────────────────────────────────
-- 25. CASHFLOW_FORECAST (Liquiditätsplanung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE cashflow_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    forecast_type VARCHAR(20), -- daily, weekly, monthly
    expected_rent DECIMAL(12,2),
    expected_other_income DECIMAL(12,2),
    expected_loan_payments DECIMAL(12,2),
    expected_utilities DECIMAL(12,2),
    expected_insurance DECIMAL(12,2),
    expected_maintenance DECIMAL(12,2),
    expected_other_expenses DECIMAL(12,2),
    expected_net_cashflow DECIMAL(12,2),
    cumulative_balance DECIMAL(14,2),
    scenario VARCHAR(20), -- base, optimistic, pessimistic
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- INDIZES
-- ═══════════════════════════════════════════════════════════════

-- Contacts
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_active ON contacts(is_active) WHERE is_active = true;
CREATE INDEX idx_contacts_name ON contacts USING gin((first_name || ' ' || last_name || ' ' || COALESCE(company_name, '')) gin_trgm_ops);

-- Contact Specialties
CREATE INDEX idx_contact_specialties_contact ON contact_specialties(contact_id);
CREATE INDEX idx_contact_specialties_specialty ON contact_specialties(specialty);

-- Properties
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_purchase_date ON properties(purchase_date);

-- Contact Properties
CREATE INDEX idx_contact_properties_property ON contact_properties(property_id);
CREATE INDEX idx_contact_properties_contact ON contact_properties(contact_id);

-- Accounts
CREATE INDEX idx_accounts_bank ON accounts(bank_id);
CREATE INDEX idx_accounts_property ON accounts(property_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = true;
CREATE INDEX idx_accounts_bhb_id ON accounts(bhb_account_id) WHERE bhb_account_id IS NOT NULL;

-- Units
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);

-- Tenants
CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_contract_end ON tenants(contract_end) WHERE contract_end IS NOT NULL;

-- Loans
CREATE INDEX idx_loans_property ON loans(property_id);
CREATE INDEX idx_loans_bank ON loans(bank_id);
CREATE INDEX idx_loans_interest_fixed_until ON loans(interest_fixed_until);

-- Loan Schedule
CREATE INDEX idx_loan_schedule_loan ON loan_schedule(loan_id);
CREATE INDEX idx_loan_schedule_date ON loan_schedule(payment_date);

-- Loan Scenarios
CREATE INDEX idx_loan_scenarios_loan ON loan_scenarios(loan_id);

-- Property Scenarios
CREATE INDEX idx_property_scenarios_property ON property_scenarios(property_id);
CREATE INDEX idx_property_scenarios_type ON property_scenarios(scenario_type);

-- Property Milestones
CREATE INDEX idx_property_milestones_property ON property_milestones(property_id);
CREATE INDEX idx_property_milestones_date ON property_milestones(target_date);
CREATE INDEX idx_property_milestones_pending ON property_milestones(target_date) WHERE is_reached = false;

-- Property Tax Data
CREATE INDEX idx_property_tax_data_property ON property_tax_data(property_id);

-- Transactions
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_bhb_id ON transactions(bhb_transaction_id) WHERE bhb_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_rental ON transactions(is_rental_income) WHERE is_rental_income = true;

-- Invoices
CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_gmi_id ON invoices(gmi_document_id) WHERE gmi_document_id IS NOT NULL;

-- Companies
CREATE INDEX idx_companies_property_related ON companies(is_property_related);

-- Company Financials
CREATE INDEX idx_company_financials_company ON company_financials(company_id);
CREATE INDEX idx_company_financials_year ON company_financials(year DESC);

-- Portfolios
CREATE INDEX idx_portfolios_broker ON portfolios(broker);

-- Positions
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_isin ON positions(isin);
CREATE INDEX idx_positions_asset_type ON positions(asset_type);

-- Position History
CREATE INDEX idx_position_history_position ON position_history(position_id);
CREATE INDEX idx_position_history_date ON position_history(date DESC);

-- Savings Plans
CREATE INDEX idx_savings_plans_portfolio ON savings_plans(portfolio_id);
CREATE INDEX idx_savings_plans_active ON savings_plans(is_active) WHERE is_active = true;

-- Daily Snapshots
CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date DESC);

-- Recurring Transactions
CREATE INDEX idx_recurring_transactions_account ON recurring_transactions(account_id);
CREATE INDEX idx_recurring_transactions_property ON recurring_transactions(property_id);
CREATE INDEX idx_recurring_transactions_next ON recurring_transactions(next_occurrence) WHERE is_active = true;

-- Cashflow Forecast
CREATE INDEX idx_cashflow_forecast_date ON cashflow_forecast(date);
CREATE INDEX idx_cashflow_forecast_type ON cashflow_forecast(forecast_type);
CREATE INDEX idx_cashflow_forecast_scenario ON cashflow_forecast(scenario);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tax_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_forecast ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Authenticated users have full access
-- (Single-user system, but secured for best practices)
-- ═══════════════════════════════════════════════════════════════

-- Banks
CREATE POLICY "Authenticated users can manage banks"
ON banks FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Contacts
CREATE POLICY "Authenticated users can manage contacts"
ON contacts FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Contact Specialties
CREATE POLICY "Authenticated users can manage contact_specialties"
ON contact_specialties FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Properties
CREATE POLICY "Authenticated users can manage properties"
ON properties FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Contact Properties
CREATE POLICY "Authenticated users can manage contact_properties"
ON contact_properties FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Accounts
CREATE POLICY "Authenticated users can manage accounts"
ON accounts FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Units
CREATE POLICY "Authenticated users can manage units"
ON units FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Tenants
CREATE POLICY "Authenticated users can manage tenants"
ON tenants FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Loans
CREATE POLICY "Authenticated users can manage loans"
ON loans FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Loan Schedule
CREATE POLICY "Authenticated users can manage loan_schedule"
ON loan_schedule FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Loan Scenarios
CREATE POLICY "Authenticated users can manage loan_scenarios"
ON loan_scenarios FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Property Scenarios
CREATE POLICY "Authenticated users can manage property_scenarios"
ON property_scenarios FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Property Milestones
CREATE POLICY "Authenticated users can manage property_milestones"
ON property_milestones FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Property Tax Data
CREATE POLICY "Authenticated users can manage property_tax_data"
ON property_tax_data FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Transactions
CREATE POLICY "Authenticated users can manage transactions"
ON transactions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Invoices
CREATE POLICY "Authenticated users can manage invoices"
ON invoices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Companies
CREATE POLICY "Authenticated users can manage companies"
ON companies FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Company Financials
CREATE POLICY "Authenticated users can manage company_financials"
ON company_financials FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Portfolios
CREATE POLICY "Authenticated users can manage portfolios"
ON portfolios FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Positions
CREATE POLICY "Authenticated users can manage positions"
ON positions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Position History
CREATE POLICY "Authenticated users can manage position_history"
ON position_history FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Savings Plans
CREATE POLICY "Authenticated users can manage savings_plans"
ON savings_plans FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Daily Snapshots
CREATE POLICY "Authenticated users can manage daily_snapshots"
ON daily_snapshots FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Recurring Transactions
CREATE POLICY "Authenticated users can manage recurring_transactions"
ON recurring_transactions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Cashflow Forecast
CREATE POLICY "Authenticated users can manage cashflow_forecast"
ON cashflow_forecast FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Service Role Policies (für n8n Workflows)
CREATE POLICY "Service role has full access to banks"
ON banks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to contacts"
ON contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to contact_specialties"
ON contact_specialties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to properties"
ON properties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to contact_properties"
ON contact_properties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to accounts"
ON accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to units"
ON units FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to tenants"
ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to loans"
ON loans FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to loan_schedule"
ON loan_schedule FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to loan_scenarios"
ON loan_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to property_scenarios"
ON property_scenarios FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to property_milestones"
ON property_milestones FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to property_tax_data"
ON property_tax_data FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to transactions"
ON transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to invoices"
ON invoices FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to companies"
ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to company_financials"
ON company_financials FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to portfolios"
ON portfolios FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to positions"
ON positions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to position_history"
ON position_history FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to savings_plans"
ON savings_plans FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to daily_snapshots"
ON daily_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to recurring_transactions"
ON recurring_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to cashflow_forecast"
ON cashflow_forecast FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View: Immobilien-Übersicht mit Kennzahlen
CREATE VIEW v_property_overview AS
SELECT
    p.id,
    p.name,
    p.address,
    p.city,
    p.property_type,
    p.purchase_date,
    p.purchase_price,
    p.current_value,
    p.unit_count,
    -- Vermietungsstand
    COUNT(u.id) AS total_units,
    COUNT(CASE WHEN u.status = 'vermietet' THEN 1 END) AS rented_units,
    COUNT(CASE WHEN u.status = 'leer' THEN 1 END) AS vacant_units,
    -- Mieteinnahmen
    SUM(u.monthly_rent_cold) AS total_monthly_rent_cold,
    SUM(u.monthly_utilities_advance) AS total_monthly_utilities,
    -- Rendite
    CASE
        WHEN p.purchase_price > 0 THEN
            (SUM(u.monthly_rent_cold) * 12 / p.purchase_price * 100)
        ELSE 0
    END AS gross_yield_percent,
    -- 10-Jahres-Frist
    p.purchase_date + INTERVAL '10 years' AS tax_free_date,
    CASE
        WHEN p.purchase_date + INTERVAL '10 years' <= CURRENT_DATE THEN true
        ELSE false
    END AS is_tax_free,
    -- Darlehen
    COALESCE(l.total_loan_balance, 0) AS total_loan_balance
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
LEFT JOIN (
    SELECT property_id, SUM(current_balance) AS total_loan_balance
    FROM loans
    GROUP BY property_id
) l ON l.property_id = p.id
GROUP BY p.id, p.name, p.address, p.city, p.property_type, p.purchase_date,
         p.purchase_price, p.current_value, p.unit_count, l.total_loan_balance;

-- View: Kontostand-Übersicht
CREATE VIEW v_account_balances AS
SELECT
    a.id,
    a.name,
    a.iban,
    b.name AS bank_name,
    a.account_type,
    a.current_balance,
    a.last_synced_at,
    p.name AS property_name,
    CASE
        WHEN a.last_synced_at IS NULL THEN 'never'
        WHEN NOW() - a.last_synced_at > INTERVAL '24 hours' THEN 'stale'
        ELSE 'current'
    END AS sync_status
FROM accounts a
LEFT JOIN banks b ON b.id = a.bank_id
LEFT JOIN properties p ON p.id = a.property_id
WHERE a.is_active = true
ORDER BY a.account_type, a.name;

-- View: Darlehen mit Restlaufzeit
CREATE VIEW v_loan_overview AS
SELECT
    l.id,
    l.loan_number,
    p.name AS property_name,
    b.name AS bank_name,
    l.original_amount,
    l.current_balance,
    l.interest_rate_nominal,
    l.monthly_payment,
    l.interest_fixed_until,
    -- Restlaufzeit Zinsbindung
    CASE
        WHEN l.interest_fixed_until IS NOT NULL THEN
            EXTRACT(DAYS FROM (l.interest_fixed_until - CURRENT_DATE))::INTEGER
        ELSE NULL
    END AS days_until_rate_change,
    -- Restlaufzeit Darlehen
    l.remaining_term_months,
    -- Sondertilgung
    l.special_repayment_allowed,
    l.special_repayment_percent,
    l.special_repayment_used_this_year,
    CASE
        WHEN l.special_repayment_allowed AND l.special_repayment_percent > 0 THEN
            (l.original_amount * l.special_repayment_percent / 100) - COALESCE(l.special_repayment_used_this_year, 0)
        ELSE 0
    END AS special_repayment_remaining
FROM loans l
LEFT JOIN properties p ON p.id = l.property_id
LEFT JOIN banks b ON b.id = l.bank_id;

-- View: Portfolio-Übersicht
CREATE VIEW v_portfolio_overview AS
SELECT
    pf.id AS portfolio_id,
    pf.name AS portfolio_name,
    pf.broker,
    COUNT(pos.id) AS position_count,
    SUM(pos.total_invested) AS total_invested,
    SUM(pos.current_value) AS current_value,
    SUM(pos.unrealized_gain_loss) AS unrealized_gain_loss,
    CASE
        WHEN SUM(pos.total_invested) > 0 THEN
            (SUM(pos.current_value) - SUM(pos.total_invested)) / SUM(pos.total_invested) * 100
        ELSE 0
    END AS total_return_percent,
    pf.last_synced_at
FROM portfolios pf
LEFT JOIN positions pos ON pos.portfolio_id = pf.id
GROUP BY pf.id, pf.name, pf.broker, pf.last_synced_at;

-- View: Nettovermögen-Komponenten
CREATE VIEW v_net_worth_breakdown AS
SELECT
    'cash' AS category,
    'Liquide Mittel' AS label,
    SUM(current_balance) AS value
FROM accounts
WHERE account_type IN ('giro', 'tagesgeld', 'festgeld') AND is_active = true

UNION ALL

SELECT
    'investments' AS category,
    'Wertpapiere' AS label,
    SUM(current_value) AS value
FROM positions

UNION ALL

SELECT
    'properties' AS category,
    'Immobilien' AS label,
    SUM(current_value) AS value
FROM properties

UNION ALL

SELECT
    'companies' AS category,
    'Firmenbeteiligungen' AS label,
    SUM(your_share_value) AS value
FROM companies

UNION ALL

SELECT
    'liabilities' AS category,
    'Verbindlichkeiten' AS label,
    -SUM(current_balance) AS value
FROM loans;

-- View: Anstehende Meilensteine
CREATE VIEW v_upcoming_milestones AS
SELECT
    pm.id,
    pm.milestone_type,
    pm.target_date,
    pm.is_reached,
    pm.notes,
    p.name AS property_name,
    p.id AS property_id,
    pm.target_date - CURRENT_DATE AS days_until
FROM property_milestones pm
JOIN properties p ON p.id = pm.property_id
WHERE pm.is_reached = false
ORDER BY pm.target_date ASC;

-- ═══════════════════════════════════════════════════════════════
-- Ende Wealth Module Schema
-- ═══════════════════════════════════════════════════════════════
