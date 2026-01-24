# LIFE OS – Personal Operating System

## 🎯 Projektziel

Ein selbst gehostetes "Second Brain" und Personal Operating System mit AI-Unterstützung für:
- **Wealth Management**: Immobilien-Portfolio (45 Wohneinheiten + Eigenheim), 50 Bankkonten, Darlehen, Investments
- **Productivity**: Unified Inbox (To-Do, Emails, Meetings, Scans), Time Tracking, Ziele
- **Health**: Habits, Nutrition, Supplements/Peptide, Training, Garmin-Integration
- **AI Copilot**: Proaktive Insights, Entscheidungsunterstützung, Telegram Bot

---

## 🏗️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| **Datenbank** | Supabase (PostgreSQL + Vector Store + Auth + Realtime) |
| **Automatisierung** | n8n (Workflows) |
| **Frontend** | React + Tailwind CSS |
| **Reverse Proxy** | Caddy (Auto-HTTPS) |
| **Container** | Docker / Docker Compose |
| **AI/LLM** | OpenAI API (GPT-4o) |
| **Bot** | Telegram Bot |
| **Hosting** | Lokal (Dev) → Hetzner (Prod) |

---

## 🔗 Externe Integrationen

| Service | Zweck | Auth |
|---------|-------|------|
| **Buchhaltungsbutler** | Konten, Transaktionen, Buchungen | API Key + Client/Secret |
| **GetMyInvoices** | Rechnungen, Belege | API Key |
| **Microsoft To-Do** | Tasks (bidirektional) | OAuth 2.0 (M365) |
| **Outlook/M365** | Emails, Kalender | OAuth 2.0 |
| **Plaud** | Meeting Minutes | Webhook (n8n) |
| **Garmin Connect** | Schlaf, Stress, Bodybatterie, HRV | OAuth 2.0 / Unofficial API |
| **Trade Republic** | ETF-Portfolio | CSV Import (keine offizielle API) |
| **Telegram** | Bot für Interaktion | Bot Token |

---

## 📊 Datenmodell

### WEALTH Module

#### properties (Immobilien)
```sql
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
```

#### units (Wohneinheiten)
```sql
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
```

#### tenants (Mieter)
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id),
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
```

#### contacts (Alle Ansprechpartner)
```sql
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
```

#### contact_properties (n:m Zuordnung)
```sql
CREATE TABLE contact_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    role VARCHAR(100), -- z.B. "Hauptansprechpartner"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contact_id, property_id)
);
```

#### contact_specialties (Handwerker-Spezialisierungen)
```sql
CREATE TABLE contact_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL, -- elektro, sanitaer, heizung, maler, dach, garten, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### banks (Banken-Stammdaten)
```sql
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
```

#### accounts (Bankkonten)
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    iban VARCHAR(34),
    bank_id UUID REFERENCES banks(id),
    account_type VARCHAR(50) NOT NULL, -- giro, tagesgeld, festgeld, depot, darlehen, ruecklage, mietkautionen, privat
    property_id UUID REFERENCES properties(id), -- Zuordnung zur Immobilie
    purpose VARCHAR(255), -- z.B. "Mieteinnahmen Haus A"
    current_balance DECIMAL(14,2) DEFAULT 0,
    bhb_account_id VARCHAR(100), -- Buchhaltungsbutler ID
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### loans (Darlehen)
```sql
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
```

#### loan_schedule (Tilgungsplan)
```sql
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
```

#### loan_scenarios (Anschlussfinanzierung-Szenarien)
```sql
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
```

#### property_scenarios (Immobilien-Planspiele)
```sql
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
```

#### property_milestones (Wichtige Termine)
```sql
CREATE TABLE property_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL, -- kaufdatum, 10_jahre_steuerfrei, zinsbindung_ende, darlehen_getilgt, sanierung_faellig
    target_date DATE NOT NULL,
    is_reached BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### property_tax_data (Steuer-Daten)
```sql
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
```

#### transactions (Buchungen aus BHB)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bhb_transaction_id VARCHAR(100) UNIQUE, -- Buchhaltungsbutler ID
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
```

#### invoices (Rechnungen aus GMI)
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmi_document_id VARCHAR(100) UNIQUE, -- GetMyInvoices ID
    property_id UUID REFERENCES properties(id),
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
    matched_transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### companies (Firmenbeteiligungen)
```sql
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
```

#### company_financials (Jahresabschlüsse)
```sql
CREATE TABLE company_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    revenue DECIMAL(12,2),
    expenses DECIMAL(12,2),
    profit DECIMAL(12,2),
    your_distribution DECIMAL(12,2),
    document_id UUID REFERENCES documents(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### portfolios (Depots)
```sql
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    broker VARCHAR(100), -- trade_republic, scalable, ing, etc.
    account_id UUID REFERENCES accounts(id),
    api_connected BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### positions (Investment-Positionen)
```sql
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
```

#### position_history (Kursverlauf)
```sql
CREATE TABLE position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price DECIMAL(12,4),
    value DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### savings_plans (Sparpläne)
```sql
CREATE TABLE savings_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id),
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(20), -- monatlich, quartalsweise
    execution_day INTEGER, -- 1-28
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_snapshots (Tägliche Vermögensübersicht)
```sql
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
```

#### recurring_transactions (Wiederkehrende Buchungen)
```sql
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20), -- income, expense
    frequency VARCHAR(20), -- monthly, quarterly, yearly
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
```

#### cashflow_forecast (Liquiditätsplanung)
```sql
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
```

### PRODUCTIVITY Module

#### inbox_items (Unified Inbox)
```sql
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL, -- microsoft_todo, plaud_meeting, email_outlook, scan_eingang, ticket, manual
    source_id VARCHAR(255), -- Original-ID im Quellsystem
    source_url TEXT,
    
    status VARCHAR(50) DEFAULT 'inbox', -- inbox, today, scheduled, someday, done, delegated
    priority INTEGER, -- 1-4 (Eisenhower)
    due_date DATE,
    scheduled_date DATE,
    estimated_minutes INTEGER,
    
    context VARCHAR(50), -- @computer, @phone, @errands, @home, @office, @low_energy, @high_energy, @quick
    
    -- Verknüpfungen
    property_id UUID REFERENCES properties(id),
    tenant_id UUID REFERENCES tenants(id),
    contact_id UUID REFERENCES contacts(id),
    project_id UUID,
    goal_id UUID REFERENCES goals(id),
    
    -- Zeiterfassung
    is_billable BOOLEAN DEFAULT FALSE,
    client_id UUID REFERENCES clients(id),
    actual_minutes INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ
);
```

#### clients (Kunden für Abrechnung)
```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    hourly_rate DECIMAL(8,2),
    billing_type VARCHAR(50), -- hourly, fixed, retainer
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### meetings (Meetings & Notes)
```sql
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    source VARCHAR(50), -- plaud, outlook_calendar, google_calendar, manual
    source_id VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    attendees JSONB, -- [{name, email}]
    location VARCHAR(255),
    
    -- Plaud-spezifisch
    transcript TEXT,
    summary TEXT,
    audio_url TEXT,
    
    -- Verknüpfungen
    client_id UUID REFERENCES clients(id),
    property_id UUID REFERENCES properties(id),
    is_billable BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### meeting_action_items (Extrahierte Aufgaben)
```sql
CREATE TABLE meeting_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    inbox_item_id UUID REFERENCES inbox_items(id),
    extracted_text TEXT,
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### time_entries (Zeiterfassung)
```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    client_id UUID REFERENCES clients(id),
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    source VARCHAR(50), -- meeting, task, manual
    meeting_id UUID REFERENCES meetings(id),
    inbox_item_id UUID REFERENCES inbox_items(id),
    is_billable BOOLEAN DEFAULT TRUE,
    is_billed BOOLEAN DEFAULT FALSE,
    invoice_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tickets (Handwerker-Aufträge)
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE, -- TKT-2025-0001
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    reported_by VARCHAR(100), -- Mieter, Verwalter, Selbst
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    priority VARCHAR(20), -- niedrig, mittel, hoch, notfall
    category VARCHAR(50), -- heizung, sanitaer, elektro, fenster_tueren, dach_fassade, garten, renovierung, sonstiges
    status VARCHAR(50) DEFAULT 'neu', -- neu, zugewiesen, in_arbeit, warte_auf_material, abgeschlossen, storniert
    assigned_to_contact_id UUID REFERENCES contacts(id),
    assigned_to_internal BOOLEAN DEFAULT FALSE, -- True = eigene Firma
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ticket_comments (Ticket-Kommentare)
```sql
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    author_type VARCHAR(50), -- owner, tenant, contractor
    attachments JSONB, -- [{url, filename}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### DOCUMENTS Module

#### documents (Alle Dokumente)
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50), -- mietvertrag, nebenkostenabrechnung, uebergabeprotokoll, kuendigung, mietanpassung, handwerker_rechnung, versicherung, darlehensvertrag, grundbuchauszug, sonstiges
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    tenant_id UUID REFERENCES tenants(id),
    file_path TEXT, -- Supabase Storage Pfad
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_indexed BOOLEAN DEFAULT FALSE, -- Für Vector Store
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### document_embeddings (Vector Store)
```sql
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI Embeddings
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector Index
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### HEALTH Module

#### habits (Gewohnheiten)
```sql
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- gesundheit, fitness, ernaehrung, supplements, produktivitaet, finanzen, beziehungen
    frequency VARCHAR(20), -- daily, weekly, monthly
    target_value DECIMAL(10,2), -- z.B. 180 für 180g Protein
    unit VARCHAR(50), -- g, mg, ml, min, count
    target_days JSONB, -- [1,2,3,4,5] = Mo-Fr
    reminder_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### habit_logs (Habit-Einträge)
```sql
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(10,2),
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);
```

#### daily_nutrition (Tägliche Makros)
```sql
CREATE TABLE daily_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    calories INTEGER,
    protein_g DECIMAL(6,1),
    carbs_g DECIMAL(6,1),
    fat_g DECIMAL(6,1),
    fiber_g DECIMAL(6,1),
    water_ml INTEGER,
    source VARCHAR(50), -- manual, myfitnesspal, cronometer
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### supplements (Supplement-Stammdaten)
```sql
CREATE TABLE supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(50), -- vitamin, mineral, aminosaeure, hormon, peptid, ped, nootropic, sonstiges
    dosage_amount DECIMAL(10,2),
    dosage_unit VARCHAR(20),
    frequency VARCHAR(20), -- daily, weekly, cycling
    timing VARCHAR(50), -- morgens, mittags, abends, pre_workout, post_workout
    cycle_on_days INTEGER,
    cycle_off_days INTEGER,
    current_stock DECIMAL(10,2),
    reorder_threshold DECIMAL(10,2),
    supplier VARCHAR(255),
    cost_per_unit DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    warnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### supplement_logs (Einnahme-Protokoll)
```sql
CREATE TABLE supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME,
    dosage_taken DECIMAL(10,2),
    is_taken BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### supplement_cycles (Zyklen für Peptide/PEDs)
```sql
CREATE TABLE supplement_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    supplements JSONB, -- Array von Supplement-IDs
    start_date DATE,
    end_date DATE,
    status VARCHAR(20), -- planned, active, completed
    protocol JSONB, -- Detaillierter Plan
    notes TEXT,
    results TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### garmin_daily_stats (Garmin-Daten)
```sql
CREATE TABLE garmin_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    -- Schlaf
    sleep_score INTEGER,
    sleep_duration_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    rem_sleep_minutes INTEGER,
    awake_minutes INTEGER,
    
    -- Energie & Stress
    body_battery_start INTEGER,
    body_battery_end INTEGER,
    body_battery_charged INTEGER,
    body_battery_drained INTEGER,
    stress_avg INTEGER,
    stress_max INTEGER,
    rest_stress_minutes INTEGER,
    low_stress_minutes INTEGER,
    medium_stress_minutes INTEGER,
    high_stress_minutes INTEGER,
    
    -- Aktivität
    steps INTEGER,
    active_calories INTEGER,
    total_calories INTEGER,
    intensity_minutes INTEGER,
    floors_climbed INTEGER,
    
    -- HRV & Herzfrequenz
    resting_hr INTEGER,
    hrv_status VARCHAR(20), -- balanced, low, high
    hrv_value INTEGER,
    
    synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### training_plans (Trainingspläne)
```sql
CREATE TABLE training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- kraft, ausdauer, mobility, hybrid
    days_per_week INTEGER,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### training_plan_days (Trainingstage)
```sql
CREATE TABLE training_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 1-7
    name VARCHAR(100), -- "Push Day", "Legs"
    focus_areas JSONB, -- ["brust", "schultern", "trizeps"]
    estimated_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### exercises (Übungs-Stammdaten)
```sql
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    muscle_group VARCHAR(100),
    equipment_needed VARCHAR(255),
    instructions TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### workouts (Tatsächliche Trainingseinheiten)
```sql
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    plan_day_id UUID REFERENCES training_plan_days(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    type VARCHAR(50),
    location VARCHAR(50), -- gym, home, outdoor
    
    -- Garmin-Daten
    garmin_activity_id VARCHAR(100),
    avg_hr INTEGER,
    max_hr INTEGER,
    calories_burned INTEGER,
    
    -- Subjektiv
    perceived_exertion INTEGER, -- 1-10
    energy_level_before INTEGER, -- 1-10
    mood_after INTEGER, -- 1-10
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### workout_sets (Tatsächliche Sätze)
```sql
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    set_number INTEGER,
    weight DECIMAL(6,2),
    reps INTEGER,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_pr BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_readiness (Trainingsbereitschaft)
```sql
CREATE TABLE daily_readiness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    sleep_score INTEGER,
    hrv_status VARCHAR(20),
    body_battery INTEGER,
    stress_avg INTEGER,
    previous_workout_intensity INTEGER,
    readiness_score INTEGER, -- 0-100
    recommendation VARCHAR(50), -- full_intensity, moderate, light_only, rest_day
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### GOALS Module

#### goals (Ziele & OKRs)
```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    timeframe VARCHAR(20) NOT NULL, -- year, quarter, month, week, day
    parent_goal_id UUID REFERENCES goals(id),
    area VARCHAR(50), -- wealth, health, career, relationships, personal_growth, lifestyle
    
    start_date DATE,
    end_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    week INTEGER,
    
    -- Messbarkeit
    target_type VARCHAR(20), -- boolean, numeric, milestone
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),
    
    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed, failed, deferred
    priority INTEGER, -- 1-4
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

#### goal_key_results (Key Results)
```sql
CREATE TABLE goal_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'not_started',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### goal_checkins (Reviews)
```sql
CREATE TABLE goal_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    progress_update TEXT,
    blockers TEXT,
    next_actions TEXT,
    confidence_level INTEGER, -- 1-10
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### DAILY LOG Module

#### daily_logs (Tagesrückblick)
```sql
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    -- Morgen-Routine
    morning_mood INTEGER, -- 1-10
    morning_energy INTEGER, -- 1-10
    morning_intention TEXT,
    top_3_priorities JSONB,
    
    -- Abend-Reflexion
    evening_mood INTEGER, -- 1-10
    evening_energy INTEGER, -- 1-10
    wins JSONB,
    lessons JSONB,
    gratitude JSONB,
    tomorrow_focus TEXT,
    
    -- Aggregierte Daten
    tasks_completed_count INTEGER,
    tasks_total_count INTEGER,
    billable_hours DECIMAL(4,1),
    meetings_count INTEGER,
    habits_completed_percent DECIMAL(5,2),
    
    -- Verknüpfungen
    garmin_stats_id UUID REFERENCES garmin_daily_stats(id),
    nutrition_id UUID REFERENCES daily_nutrition(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### weekly_reviews (Wochenrückblick)
```sql
CREATE TABLE weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    
    -- Auto-Metriken
    tasks_completed INTEGER,
    tasks_created INTEGER,
    tasks_overdue INTEGER,
    meetings_count INTEGER,
    meetings_hours DECIMAL(5,1),
    billable_hours DECIMAL(5,1),
    billable_revenue DECIMAL(10,2),
    focus_sessions_count INTEGER,
    focus_hours_total DECIMAL(5,1),
    inbox_processed INTEGER,
    inbox_remaining INTEGER,
    
    -- Goals
    weekly_goals_completed JSONB,
    weekly_goals_missed JSONB,
    
    -- Health
    avg_sleep_score DECIMAL(5,1),
    avg_stress DECIMAL(5,1),
    workouts_completed INTEGER,
    workouts_planned INTEGER,
    habits_completion_rate DECIMAL(5,2),
    
    -- Reflexion
    wins JSONB,
    challenges JSONB,
    lessons_learned TEXT,
    next_week_focus TEXT,
    overall_rating INTEGER, -- 1-10
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number)
);
```

### AI COPILOT Module

#### ai_insights (Generierte Insights)
```sql
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(100),
    category VARCHAR(50), -- wealth, health, productivity, goals
    priority VARCHAR(20), -- info, warning, action_required
    title VARCHAR(500),
    message TEXT,
    data JSONB,
    suggested_actions JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_actioned BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
```

#### telegram_messages (Nachrichtenverlauf)
```sql
CREATE TABLE telegram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_message_id BIGINT,
    chat_id BIGINT,
    direction VARCHAR(20), -- incoming, outgoing
    message_type VARCHAR(20), -- text, voice, command
    content TEXT,
    transcription TEXT, -- Für Voice Messages
    intent_detected VARCHAR(100),
    entities_extracted JSONB,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### telegram_reminders (Erinnerungen)
```sql
CREATE TABLE telegram_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_type VARCHAR(100),
    scheduled_time TIME,
    message_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMPTZ,
    conditions JSONB, -- z.B. "nur wenn Habit nicht done"
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### SYSTEM Module

#### sync_status (Sync-Status)
```sql
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL UNIQUE, -- bhb, gmi, garmin, todo, outlook
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20), -- success, error
    items_synced INTEGER,
    errors JSONB,
    next_scheduled_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### audit_logs (Audit Trail)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    action VARCHAR(20), -- create, read, update, delete
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    source VARCHAR(50) -- web, telegram, n8n, api
);
```

---

## 🔄 n8n Workflows

### Übersicht

| # | Workflow | Trigger | Beschreibung |
|---|----------|---------|--------------|
| **WEALTH** ||||
| 1 | sync-bhb-accounts | Cron 06:00 | Konten aus Buchhaltungsbutler |
| 2 | sync-bhb-transactions | Cron 06:15 | Transaktionen aus BHB |
| 3 | sync-gmi-invoices | Cron 06:30 | Rechnungen aus GetMyInvoices |
| 4 | sync-trade-republic | Cron 07:00 | Portfolio (CSV-Import) |
| 5 | fetch-etf-prices | Cron 20:00 | Kursdaten von Yahoo Finance |
| 6 | create-daily-snapshot | Cron 23:00 | Vermögensaggregation |
| 7 | check-rent-payments | Cron 5. des Monats | Mieteingangs-Prüfung |
| 8 | check-loan-milestones | Cron monatlich | Zinsbindung, 10-Jahres-Frist |
| **PRODUCTIVITY** ||||
| 9 | sync-microsoft-todo | Cron alle 10min | Tasks bidirektional |
| 10 | process-plaud-meeting | Webhook | Meeting Minutes → Inbox |
| 11 | check-outlook-inbox | Cron alle 30min | Unbeantwortete Mails |
| 12 | process-scan-inbox | Webhook | GMI neue Dokumente → Inbox |
| **HEALTH** ||||
| 13 | sync-garmin-daily | Cron 08:00 | Schlaf, Stress, Bodybatterie |
| 14 | send-supplement-reminder | Cron täglich | Einnahme-Erinnerung |
| 15 | send-training-reminder | Cron täglich | Heutiges Training |
| 16 | calculate-readiness | Cron 07:00 | Trainingsbereitschaft |
| **AI COPILOT** ||||
| 17 | generate-morning-briefing | Cron 06:30 | Tägliches Briefing → Telegram |
| 18 | generate-weekly-review | Cron So 18:00 | Wochenplanung → Telegram |
| 19 | generate-insights | Cron 22:00 | AI Insights aus Daten |
| 20 | process-telegram-message | Webhook | Telegram Bot Handler |
| **DOCUMENTS** ||||
| 21 | index-document | Webhook | PDF → Embeddings → Supabase |

---

## 📱 Telegram Bot Commands

### Quick Capture
- `/task <text>` – Neue Aufgabe in Inbox
- `/note <text>` – Schnelle Notiz
- `/expense <betrag> <kategorie>` – Ausgabe erfassen
- `/weight <kg>` – Gewicht loggen
- `/mood <1-10>` – Stimmung erfassen
- `/water <ml>` – Wasser tracken
- `/habit <name>` – Habit als erledigt
- `/sup <name>` – Supplement eingenommen

### Quick Views
- `/today` – Tagesübersicht
- `/inbox` – Offene Inbox-Items
- `/balance` – Kontostände
- `/networth` – Nettovermögen
- `/habits` – Heutige Habits
- `/workout` – Heutiges Training
- `/energy` – Garmin-Daten
- `/goals` – Ziel-Fortschritte

### Voice Commands
- Whisper API für Transkription
- "Erstelle eine Aufgabe: ..."
- "Wie ist mein Kontostand bei ...?"
- "Was steht heute auf meinem Plan?"

---

## 🎯 Implementierungs-Phasen

| Phase | Fokus | Dauer |
|-------|-------|-------|
| **1** | Foundation: Docker, Supabase, Caddy, Auth | 2 Wochen |
| **2** | Wealth Core: Immobilien, Konten, Darlehen, BHB/GMI Sync | 3 Wochen |
| **3** | Wealth Advanced: Planspiele, Szenarien, Milestones, Steuer | 2 Wochen |
| **4** | Productivity: Inbox, To-Do Sync, Plaud, Time Tracking | 2 Wochen |
| **5** | Health: Habits, Supplements, Garmin, Readiness | 2 Wochen |
| **6** | Training: Pläne, Workout-Tracking | 1 Woche |
| **7** | Goals: OKRs, Hierarchie, Reviews | 1 Woche |
| **8** | AI Copilot: Insights, Briefings, Telegram Bot | 3 Wochen |
| **9** | Polish: UI/UX, Reports, Mobile | 2 Wochen |

---

## 🔐 Umgebungsvariablen

Siehe `.env.example` für alle benötigten Variablen.

---

## 📚 Referenzen

- [Supabase Docs](https://supabase.com/docs)
- [n8n Docs](https://docs.n8n.io)
- [Caddy Docs](https://caddyserver.com/docs)
- [Buchhaltungsbutler API](https://app.buchhaltungsbutler.de/docs/api/v1/)
- [GetMyInvoices API](https://api.getmyinvoices.com/accounts/v3/doc/)
- [Garmin Connect API](https://developer.garmin.com/gc-developer-program/overview/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
