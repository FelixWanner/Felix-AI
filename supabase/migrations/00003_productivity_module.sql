-- ═══════════════════════════════════════════════════════════════
-- Life OS - Productivity Module Schema
-- Migration: 00003_productivity_module.sql
-- ═══════════════════════════════════════════════════════════════
-- Inbox, Tasks, Meetings, Time Tracking, Tickets, Documents
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. CLIENTS (Kunden für Abrechnung)
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

-- ───────────────────────────────────────────────────────────────
-- 2. INBOX_ITEMS (Unified Inbox)
-- ───────────────────────────────────────────────────────────────
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

    -- Verknüpfungen (References zu Wealth Module)
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    project_id UUID, -- Für spätere Projekt-Erweiterung
    goal_id UUID, -- FK wird in goals module hinzugefügt

    -- Zeiterfassung
    is_billable BOOLEAN DEFAULT FALSE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    actual_minutes INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('inbox_items');

-- ───────────────────────────────────────────────────────────────
-- 3. MEETINGS (Meetings & Notes)
-- ───────────────────────────────────────────────────────────────
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
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    is_billable BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 4. MEETING_ACTION_ITEMS (Extrahierte Aufgaben)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE meeting_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    inbox_item_id UUID REFERENCES inbox_items(id) ON DELETE SET NULL,
    extracted_text TEXT,
    assigned_to VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 5. TIME_ENTRIES (Zeiterfassung)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    source VARCHAR(50), -- meeting, task, manual
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    inbox_item_id UUID REFERENCES inbox_items(id) ON DELETE SET NULL,
    is_billable BOOLEAN DEFAULT TRUE,
    is_billed BOOLEAN DEFAULT FALSE,
    invoice_id UUID, -- Referenz zu externer Rechnungs-ID
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 6. TICKETS (Handwerker-Aufträge)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE, -- TKT-2025-0001
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    reported_by VARCHAR(100), -- Mieter, Verwalter, Selbst
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    priority VARCHAR(20), -- niedrig, mittel, hoch, notfall
    category VARCHAR(50), -- heizung, sanitaer, elektro, fenster_tueren, dach_fassade, garten, renovierung, sonstiges
    status VARCHAR(50) DEFAULT 'neu', -- neu, zugewiesen, in_arbeit, warte_auf_material, abgeschlossen, storniert
    assigned_to_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to_internal BOOLEAN DEFAULT FALSE, -- True = eigene Firma
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('tickets');

-- Trigger für automatische Ticket-Nummer
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
            LPAD(
                (SELECT COALESCE(MAX(
                    CAST(SUBSTRING(ticket_number FROM 10) AS INTEGER)
                ), 0) + 1
                FROM tickets
                WHERE ticket_number LIKE 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-%')::TEXT,
                4, '0'
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- ───────────────────────────────────────────────────────────────
-- 7. TICKET_COMMENTS (Ticket-Kommentare)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    author_type VARCHAR(50), -- owner, tenant, contractor
    attachments JSONB, -- [{url, filename}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 8. DOCUMENTS (Alle Dokumente)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50), -- mietvertrag, nebenkostenabrechnung, uebergabeprotokoll, kuendigung, mietanpassung, handwerker_rechnung, versicherung, darlehensvertrag, grundbuchauszug, sonstiges
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    file_path TEXT, -- Supabase Storage Pfad
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_indexed BOOLEAN DEFAULT FALSE, -- Für Vector Store
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jetzt FK für company_financials.document_id hinzufügen (aus Wealth Module)
ALTER TABLE company_financials ADD CONSTRAINT fk_company_financials_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────
-- 9. DOCUMENT_EMBEDDINGS (Vector Store für RAG)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat Index für Vector Similarity Search
-- lists = sqrt(rows) ist eine gute Faustregel, hier 100 für bis zu 10.000 chunks
CREATE INDEX idx_document_embeddings_vector
ON document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ═══════════════════════════════════════════════════════════════
-- VECTOR SEARCH FUNCTION
-- ═══════════════════════════════════════════════════════════════

-- Funktion für Semantic Search über Dokumente
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    property_name VARCHAR(255),
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        d.title AS document_title,
        d.document_type,
        p.name AS property_name,
        de.chunk_index,
        de.content,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    LEFT JOIN properties p ON p.id = d.property_id
    WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Alternative Funktion mit Filter nach Property
CREATE OR REPLACE FUNCTION match_documents_by_property(
    query_embedding vector(1536),
    filter_property_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        d.title AS document_title,
        d.document_type,
        de.chunk_index,
        de.content,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE d.property_id = filter_property_id
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Funktion für Dokument-Typ-Filter
CREATE OR REPLACE FUNCTION match_documents_by_type(
    query_embedding vector(1536),
    filter_document_type VARCHAR(50),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    property_name VARCHAR(255),
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        d.title AS document_title,
        p.name AS property_name,
        de.chunk_index,
        de.content,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    LEFT JOIN properties p ON p.id = d.property_id
    WHERE d.document_type = filter_document_type
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- INDIZES
-- ═══════════════════════════════════════════════════════════════

-- Clients
CREATE INDEX idx_clients_active ON clients(is_active) WHERE is_active = true;
CREATE INDEX idx_clients_name ON clients USING gin(name gin_trgm_ops);

-- Inbox Items
CREATE INDEX idx_inbox_items_status ON inbox_items(status);
CREATE INDEX idx_inbox_items_due_date ON inbox_items(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_inbox_items_scheduled ON inbox_items(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_inbox_items_source ON inbox_items(source);
CREATE INDEX idx_inbox_items_source_id ON inbox_items(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX idx_inbox_items_property ON inbox_items(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_inbox_items_tenant ON inbox_items(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_inbox_items_client ON inbox_items(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_inbox_items_context ON inbox_items(context) WHERE context IS NOT NULL;
CREATE INDEX idx_inbox_items_priority ON inbox_items(priority) WHERE priority IS NOT NULL;
CREATE INDEX idx_inbox_items_billable ON inbox_items(is_billable) WHERE is_billable = true;
CREATE INDEX idx_inbox_items_title ON inbox_items USING gin(title gin_trgm_ops);

-- Meetings
CREATE INDEX idx_meetings_start_time ON meetings(start_time DESC);
CREATE INDEX idx_meetings_source ON meetings(source);
CREATE INDEX idx_meetings_source_id ON meetings(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX idx_meetings_client ON meetings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_meetings_property ON meetings(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_meetings_billable ON meetings(is_billable) WHERE is_billable = true;

-- Meeting Action Items
CREATE INDEX idx_meeting_action_items_meeting ON meeting_action_items(meeting_id);
CREATE INDEX idx_meeting_action_items_inbox ON meeting_action_items(inbox_item_id) WHERE inbox_item_id IS NOT NULL;
CREATE INDEX idx_meeting_action_items_due ON meeting_action_items(due_date) WHERE due_date IS NOT NULL;

-- Time Entries
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX idx_time_entries_client ON time_entries(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_time_entries_meeting ON time_entries(meeting_id) WHERE meeting_id IS NOT NULL;
CREATE INDEX idx_time_entries_inbox ON time_entries(inbox_item_id) WHERE inbox_item_id IS NOT NULL;
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, is_billed);
CREATE INDEX idx_time_entries_unbilled ON time_entries(client_id) WHERE is_billable = true AND is_billed = false;

-- Tickets
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_property ON tickets(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_tickets_unit ON tickets(unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to_contact_id) WHERE assigned_to_contact_id IS NOT NULL;
CREATE INDEX idx_tickets_reported_at ON tickets(reported_at DESC);
CREATE INDEX idx_tickets_open ON tickets(status) WHERE status NOT IN ('abgeschlossen', 'storniert');

-- Ticket Comments
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created ON ticket_comments(created_at DESC);

-- Documents
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_property ON documents(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_documents_unit ON documents(unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX idx_documents_tenant ON documents(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_documents_indexed ON documents(is_indexed);
CREATE INDEX idx_documents_uploaded ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_title ON documents USING gin(title gin_trgm_ops);

-- Document Embeddings
CREATE INDEX idx_document_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_chunk ON document_embeddings(document_id, chunk_index);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Authenticated Users
-- ═══════════════════════════════════════════════════════════════

-- Clients
CREATE POLICY "Authenticated users can manage clients"
ON clients FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Inbox Items
CREATE POLICY "Authenticated users can manage inbox_items"
ON inbox_items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Meetings
CREATE POLICY "Authenticated users can manage meetings"
ON meetings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Meeting Action Items
CREATE POLICY "Authenticated users can manage meeting_action_items"
ON meeting_action_items FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Time Entries
CREATE POLICY "Authenticated users can manage time_entries"
ON time_entries FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Tickets
CREATE POLICY "Authenticated users can manage tickets"
ON tickets FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Ticket Comments
CREATE POLICY "Authenticated users can manage ticket_comments"
ON ticket_comments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "Authenticated users can manage documents"
ON documents FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Document Embeddings
CREATE POLICY "Authenticated users can manage document_embeddings"
ON document_embeddings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES - Service Role (für n8n Workflows)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Service role has full access to clients"
ON clients FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to inbox_items"
ON inbox_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to meetings"
ON meetings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to meeting_action_items"
ON meeting_action_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to time_entries"
ON time_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to tickets"
ON tickets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to ticket_comments"
ON ticket_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to documents"
ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to document_embeddings"
ON document_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View: Inbox Übersicht
CREATE VIEW v_inbox_overview AS
SELECT
    i.id,
    i.title,
    i.status,
    i.priority,
    i.due_date,
    i.scheduled_date,
    i.source,
    i.context,
    i.estimated_minutes,
    i.actual_minutes,
    i.is_billable,
    c.name AS client_name,
    p.name AS property_name,
    t.name AS tenant_name,
    CASE
        WHEN i.due_date < CURRENT_DATE AND i.status NOT IN ('done', 'delegated') THEN 'overdue'
        WHEN i.due_date = CURRENT_DATE THEN 'today'
        WHEN i.due_date = CURRENT_DATE + 1 THEN 'tomorrow'
        WHEN i.due_date <= CURRENT_DATE + 7 THEN 'this_week'
        ELSE 'later'
    END AS due_status
FROM inbox_items i
LEFT JOIN clients c ON c.id = i.client_id
LEFT JOIN properties p ON p.id = i.property_id
LEFT JOIN tenants t ON t.id = i.tenant_id
WHERE i.status NOT IN ('done', 'delegated');

-- View: Heute fällige Items
CREATE VIEW v_today_items AS
SELECT * FROM v_inbox_overview
WHERE due_date = CURRENT_DATE OR scheduled_date = CURRENT_DATE OR status = 'today'
ORDER BY priority NULLS LAST, due_date NULLS LAST;

-- View: Offene Tickets
CREATE VIEW v_open_tickets AS
SELECT
    t.id,
    t.ticket_number,
    t.title,
    t.priority,
    t.category,
    t.status,
    t.reported_at,
    t.estimated_cost,
    t.actual_cost,
    p.name AS property_name,
    u.unit_number,
    c.company_name AS contractor_name,
    c.phone AS contractor_phone,
    EXTRACT(DAYS FROM (NOW() - t.reported_at))::INTEGER AS days_open
FROM tickets t
LEFT JOIN properties p ON p.id = t.property_id
LEFT JOIN units u ON u.id = t.unit_id
LEFT JOIN contacts c ON c.id = t.assigned_to_contact_id
WHERE t.status NOT IN ('abgeschlossen', 'storniert')
ORDER BY
    CASE t.priority
        WHEN 'notfall' THEN 1
        WHEN 'hoch' THEN 2
        WHEN 'mittel' THEN 3
        WHEN 'niedrig' THEN 4
        ELSE 5
    END,
    t.reported_at ASC;

-- View: Unbilled Time Entries
CREATE VIEW v_unbilled_time AS
SELECT
    te.id,
    te.date,
    te.description,
    te.duration_minutes,
    c.name AS client_name,
    c.hourly_rate,
    ROUND((te.duration_minutes / 60.0) * c.hourly_rate, 2) AS estimated_amount
FROM time_entries te
JOIN clients c ON c.id = te.client_id
WHERE te.is_billable = true
  AND te.is_billed = false
ORDER BY c.name, te.date;

-- View: Time Summary by Client
CREATE VIEW v_time_summary_by_client AS
SELECT
    c.id AS client_id,
    c.name AS client_name,
    c.hourly_rate,
    COUNT(te.id) AS entry_count,
    SUM(te.duration_minutes) AS total_minutes,
    ROUND(SUM(te.duration_minutes) / 60.0, 2) AS total_hours,
    SUM(CASE WHEN te.is_billed = false THEN te.duration_minutes ELSE 0 END) AS unbilled_minutes,
    ROUND(SUM(CASE WHEN te.is_billed = false THEN te.duration_minutes ELSE 0 END) / 60.0 * c.hourly_rate, 2) AS unbilled_amount
FROM clients c
LEFT JOIN time_entries te ON te.client_id = c.id AND te.is_billable = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.hourly_rate;

-- View: Meeting Summary
CREATE VIEW v_meeting_summary AS
SELECT
    m.id,
    m.title,
    m.start_time,
    m.duration_minutes,
    m.source,
    m.is_billable,
    c.name AS client_name,
    p.name AS property_name,
    COUNT(mai.id) AS action_item_count,
    COUNT(CASE WHEN mai.inbox_item_id IS NOT NULL THEN 1 END) AS linked_tasks
FROM meetings m
LEFT JOIN clients c ON c.id = m.client_id
LEFT JOIN properties p ON p.id = m.property_id
LEFT JOIN meeting_action_items mai ON mai.meeting_id = m.id
GROUP BY m.id, m.title, m.start_time, m.duration_minutes, m.source, m.is_billable, c.name, p.name
ORDER BY m.start_time DESC;

-- View: Document Library
CREATE VIEW v_document_library AS
SELECT
    d.id,
    d.title,
    d.document_type,
    d.file_path,
    d.file_size,
    d.mime_type,
    d.uploaded_at,
    d.is_indexed,
    p.name AS property_name,
    u.unit_number,
    t.name AS tenant_name,
    (SELECT COUNT(*) FROM document_embeddings de WHERE de.document_id = d.id) AS chunk_count
FROM documents d
LEFT JOIN properties p ON p.id = d.property_id
LEFT JOIN units u ON u.id = d.unit_id
LEFT JOIN tenants t ON t.id = d.tenant_id
ORDER BY d.uploaded_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- Ende Productivity Module Schema
-- ═══════════════════════════════════════════════════════════════
