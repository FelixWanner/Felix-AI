-- ═══════════════════════════════════════════════════════════════
-- Life OS - Productivity Module Schema
-- Migration: 00003_productivity_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- Clients (Kunden für Abrechnung)
-- ───────────────────────────────────────────────────────────────
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

SELECT create_updated_at_trigger('clients');
CREATE INDEX idx_clients_active ON clients(is_active);

-- ───────────────────────────────────────────────────────────────
-- Goals (for FK reference - will be expanded in 00005)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    timeframe VARCHAR(20) NOT NULL,
    parent_goal_id UUID REFERENCES goals(id),
    area VARCHAR(50),
    start_date DATE,
    end_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    week INTEGER,
    target_type VARCHAR(20),
    target_value DECIMAL(14,2),
    current_value DECIMAL(14,2),
    unit VARCHAR(50),
    progress_percent DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'not_started',
    priority INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_timeframe ON goals(timeframe);
CREATE INDEX idx_goals_area ON goals(area);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);

-- ───────────────────────────────────────────────────────────────
-- Inbox Items (Unified Inbox)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL, -- microsoft_todo, plaud_meeting, email_outlook, scan_eingang, ticket, manual
    source_id VARCHAR(255),
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

CREATE INDEX idx_inbox_items_status ON inbox_items(status);
CREATE INDEX idx_inbox_items_source ON inbox_items(source);
CREATE INDEX idx_inbox_items_due_date ON inbox_items(due_date);
CREATE INDEX idx_inbox_items_scheduled ON inbox_items(scheduled_date);
CREATE INDEX idx_inbox_items_context ON inbox_items(context);
CREATE INDEX idx_inbox_items_property ON inbox_items(property_id);
CREATE INDEX idx_inbox_items_client ON inbox_items(client_id);

-- ───────────────────────────────────────────────────────────────
-- Meetings (Meetings & Notes)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    source VARCHAR(50), -- plaud, outlook_calendar, google_calendar, manual
    source_id VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    attendees JSONB,
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

CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_source ON meetings(source);
CREATE INDEX idx_meetings_client ON meetings(client_id);

-- ───────────────────────────────────────────────────────────────
-- Meeting Action Items (Extrahierte Aufgaben)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE meeting_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    inbox_item_id UUID REFERENCES inbox_items(id),
    extracted_text TEXT,
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);

-- ───────────────────────────────────────────────────────────────
-- Time Entries (Zeiterfassung)
-- ───────────────────────────────────────────────────────────────
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

CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, is_billed);

-- ───────────────────────────────────────────────────────────────
-- Tickets (Handwerker-Aufträge)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    reported_by VARCHAR(100),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    priority VARCHAR(20), -- niedrig, mittel, hoch, notfall
    category VARCHAR(50), -- heizung, sanitaer, elektro, fenster_tueren, dach_fassade, garten, renovierung, sonstiges
    status VARCHAR(50) DEFAULT 'neu', -- neu, zugewiesen, in_arbeit, warte_auf_material, abgeschlossen, storniert
    assigned_to_contact_id UUID REFERENCES contacts(id),
    assigned_to_internal BOOLEAN DEFAULT FALSE,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('tickets');
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_property ON tickets(property_id);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category ON tickets(category);

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || EXTRACT(YEAR FROM NOW()) || '-' ||
                           LPAD(nextval('ticket_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

-- ───────────────────────────────────────────────────────────────
-- Ticket Comments (Ticket-Kommentare)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    author_type VARCHAR(50), -- owner, tenant, contractor
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- ───────────────────────────────────────────────────────────────
-- Documents (Alle Dokumente)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    tenant_id UUID REFERENCES tenants(id),
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_indexed BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_indexed ON documents(is_indexed);

-- ───────────────────────────────────────────────────────────────
-- Document Embeddings (Vector Store)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI Embeddings
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_embeddings_document ON document_embeddings(document_id);

-- Vector Index for similarity search
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON clients FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON goals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON inbox_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON meetings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON meeting_action_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON time_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ticket_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON document_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
CREATE POLICY "Authenticated read access" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON inbox_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON meeting_action_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON time_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON ticket_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON document_embeddings FOR SELECT TO authenticated USING (true);

-- ───────────────────────────────────────────────────────────────
-- Helper Functions
-- ───────────────────────────────────────────────────────────────

-- Function to search documents by semantic similarity
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        document_embeddings.id,
        document_embeddings.document_id,
        document_embeddings.content,
        1 - (document_embeddings.embedding <=> query_embedding) as similarity
    FROM document_embeddings
    WHERE 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY document_embeddings.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Ende Productivity Schema
-- ═══════════════════════════════════════════════════════════════
