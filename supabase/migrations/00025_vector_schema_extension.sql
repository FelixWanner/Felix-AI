-- ═══════════════════════════════════════════════════════════════
-- Life OS - Vector Schema Extension
-- Migration: 00025_vector_schema_extension.sql
-- ═══════════════════════════════════════════════════════════════
-- Erweitert die bestehende Vector-Datenbank für:
-- - Erweiterte Dokumenttypen (PDFs, Webseiten, Notizen, Chat-Verläufe)
-- - Multi-User Support
-- - Full-Text-Search Integration
-- - Hierarchische Chunks
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. ENUMS für Dokumentkategorien und Chunk-Typen
-- ───────────────────────────────────────────────────────────────

-- Dokumentkategorien
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM (
        'pdf',
        'webpage',
        'note',
        'chat',
        'email',
        'transcript'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chunk-Typen für verschiedene Embedding-Strategien
DO $$ BEGIN
    CREATE TYPE chunk_type AS ENUM (
        'standard',      -- Normaler Textchunk
        'summary',       -- Zusammenfassung eines Dokuments/Abschnitts
        'question',      -- Generierte Frage für HyDE
        'title',         -- Titel/Überschrift
        'metadata'       -- Metadaten-Chunk
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 2. DOCUMENTS Tabelle erweitern
-- ───────────────────────────────────────────────────────────────

-- Neue Spalten für erweiterte Funktionalität
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS category document_category,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS total_chunks INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS embedding_dimensions INTEGER,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fts_content tsvector;

-- Kommentar für die neuen Spalten
COMMENT ON COLUMN documents.category IS 'Dokumentkategorie: pdf, webpage, note, chat, email, transcript';
COMMENT ON COLUMN documents.source_url IS 'Original-URL für Webseiten oder externe Quellen';
COMMENT ON COLUMN documents.source_type IS 'Quelle: upload, crawl, api, telegram, n8n';
COMMENT ON COLUMN documents.content_hash IS 'SHA-256 Hash für Deduplizierung';
COMMENT ON COLUMN documents.total_chunks IS 'Anzahl der Chunks nach dem Chunking';
COMMENT ON COLUMN documents.total_tokens IS 'Geschätzte Token-Anzahl des gesamten Dokuments';
COMMENT ON COLUMN documents.embedding_model IS 'Verwendetes Embedding-Modell (z.B. text-embedding-3-large)';
COMMENT ON COLUMN documents.embedding_dimensions IS 'Dimensionen der Embeddings (1536, 3072)';
COMMENT ON COLUMN documents.user_id IS 'Referenz zu auth.users für Multi-User-Support';
COMMENT ON COLUMN documents.fts_content IS 'Full-Text-Search Vector für Titel und Metadaten';

-- Index für content_hash (Deduplizierung)
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash) WHERE content_hash IS NOT NULL;

-- Index für user_id (Multi-User)
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id) WHERE user_id IS NOT NULL;

-- Index für category
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category) WHERE category IS NOT NULL;

-- GIN Index für Full-Text-Search
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(fts_content);

-- Trigger für automatische FTS-Aktualisierung
CREATE OR REPLACE FUNCTION update_documents_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts_content := to_tsvector('german',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.document_type, '') || ' ' ||
        COALESCE(NEW.metadata::text, '')
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_documents_fts ON documents;
CREATE TRIGGER trigger_documents_fts
    BEFORE INSERT OR UPDATE OF title, document_type, metadata
    ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_fts();

-- ───────────────────────────────────────────────────────────────
-- 3. DOCUMENT_EMBEDDINGS Tabelle erweitern
-- ───────────────────────────────────────────────────────────────

-- Neue Spalten für erweiterte Chunk-Informationen
ALTER TABLE document_embeddings
    ADD COLUMN IF NOT EXISTS parent_chunk_id UUID REFERENCES document_embeddings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS chunk_type chunk_type DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS token_count INTEGER,
    ADD COLUMN IF NOT EXISTS char_start INTEGER,
    ADD COLUMN IF NOT EXISTS char_end INTEGER,
    ADD COLUMN IF NOT EXISTS page_number INTEGER,
    ADD COLUMN IF NOT EXISTS section_title VARCHAR(500),
    ADD COLUMN IF NOT EXISTS fts_content tsvector;

-- Kommentare
COMMENT ON COLUMN document_embeddings.parent_chunk_id IS 'Referenz auf Parent-Chunk für hierarchische Strukturen';
COMMENT ON COLUMN document_embeddings.chunk_type IS 'Typ des Chunks: standard, summary, question, title, metadata';
COMMENT ON COLUMN document_embeddings.token_count IS 'Anzahl der Tokens in diesem Chunk';
COMMENT ON COLUMN document_embeddings.char_start IS 'Startposition im Originaldokument (Zeichen)';
COMMENT ON COLUMN document_embeddings.char_end IS 'Endposition im Originaldokument (Zeichen)';
COMMENT ON COLUMN document_embeddings.page_number IS 'Seitenzahl für PDFs';
COMMENT ON COLUMN document_embeddings.section_title IS 'Überschrift des Abschnitts';
COMMENT ON COLUMN document_embeddings.fts_content IS 'Full-Text-Search Vector für Chunk-Inhalt';

-- Index für hierarchische Chunks
CREATE INDEX IF NOT EXISTS idx_embeddings_parent ON document_embeddings(parent_chunk_id) WHERE parent_chunk_id IS NOT NULL;

-- Index für Chunk-Typ
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_type ON document_embeddings(chunk_type);

-- Index für Seitennummer
CREATE INDEX IF NOT EXISTS idx_embeddings_page ON document_embeddings(document_id, page_number) WHERE page_number IS NOT NULL;

-- GIN Index für Full-Text-Search auf Chunks
CREATE INDEX IF NOT EXISTS idx_embeddings_fts ON document_embeddings USING GIN(fts_content);

-- Trigger für automatische FTS-Aktualisierung
CREATE OR REPLACE FUNCTION update_embeddings_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fts_content := to_tsvector('german', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_embeddings_fts ON document_embeddings;
CREATE TRIGGER trigger_embeddings_fts
    BEFORE INSERT OR UPDATE OF content
    ON document_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_embeddings_fts();

-- ───────────────────────────────────────────────────────────────
-- 4. CHUNKING_CONFIGS Tabelle (Vorkonfigurierte Strategien)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chunking_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Chunking-Parameter
    chunk_size INTEGER NOT NULL DEFAULT 1000,
    chunk_overlap INTEGER NOT NULL DEFAULT 200,
    min_chunk_size INTEGER DEFAULT 100,
    max_chunk_size INTEGER DEFAULT 2000,

    -- Splitting-Strategie
    split_by VARCHAR(50) DEFAULT 'recursive', -- recursive, sentence, paragraph, page, semantic
    separators JSONB DEFAULT '["\\n\\n", "\\n", ". ", " "]',

    -- Für welche Dokumenttypen
    applicable_categories document_category[],

    -- Metadaten
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at Trigger
SELECT create_updated_at_trigger('chunking_configs');

-- Kommentare
COMMENT ON TABLE chunking_configs IS 'Vorkonfigurierte Chunking-Strategien für verschiedene Dokumenttypen';
COMMENT ON COLUMN chunking_configs.chunk_size IS 'Ziel-Größe eines Chunks in Zeichen';
COMMENT ON COLUMN chunking_configs.chunk_overlap IS 'Überlappung zwischen Chunks in Zeichen';
COMMENT ON COLUMN chunking_configs.split_by IS 'Splitting-Strategie: recursive, sentence, paragraph, page, semantic';

-- Standard-Chunking-Konfigurationen
INSERT INTO chunking_configs (name, description, chunk_size, chunk_overlap, split_by, applicable_categories, is_default)
VALUES
    ('standard', 'Standard-Konfiguration für die meisten Dokumente', 1000, 200, 'recursive',
     ARRAY['pdf', 'note', 'email']::document_category[], true),
    ('webpage', 'Optimiert für Webseiten mit strukturiertem Content', 800, 150, 'paragraph',
     ARRAY['webpage']::document_category[], false),
    ('chat', 'Optimiert für Chat-Verläufe (größere Chunks für Kontext)', 1500, 300, 'paragraph',
     ARRAY['chat']::document_category[], false),
    ('transcript', 'Optimiert für Transkripte (Satz-basiert)', 600, 100, 'sentence',
     ARRAY['transcript']::document_category[], false),
    ('small', 'Kleine Chunks für präzise Suche', 500, 100, 'recursive',
     NULL, false),
    ('large', 'Große Chunks für mehr Kontext', 2000, 400, 'recursive',
     NULL, false)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    chunk_size = EXCLUDED.chunk_size,
    chunk_overlap = EXCLUDED.chunk_overlap,
    split_by = EXCLUDED.split_by,
    applicable_categories = EXCLUDED.applicable_categories,
    updated_at = NOW();

-- ───────────────────────────────────────────────────────────────
-- 5. EMBEDDING_JOBS Tabelle (für asynchrone Verarbeitung)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS embedding_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Job-Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 0, -- Höher = wichtiger

    -- Verarbeitungsdetails
    chunking_config_id UUID REFERENCES chunking_configs(id),
    chunks_total INTEGER,
    chunks_processed INTEGER DEFAULT 0,

    -- Fehlerbehandlung
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Zeitstempel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Für n8n Webhook
    webhook_url TEXT,
    callback_data JSONB
);

-- Indizes für Job-Queue
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status ON embedding_jobs(status);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_priority ON embedding_jobs(priority DESC, created_at ASC)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_document ON embedding_jobs(document_id);

-- Kommentare
COMMENT ON TABLE embedding_jobs IS 'Queue für asynchrone Embedding-Verarbeitung';

-- ───────────────────────────────────────────────────────────────
-- 6. RLS für neue Tabellen
-- ───────────────────────────────────────────────────────────────

ALTER TABLE chunking_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_jobs ENABLE ROW LEVEL SECURITY;

-- Chunking Configs: Nur lesen für alle
CREATE POLICY "Everyone can read chunking_configs"
ON chunking_configs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Service role full access to chunking_configs"
ON chunking_configs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Embedding Jobs: Service role verwaltet
CREATE POLICY "Service role full access to embedding_jobs"
ON embedding_jobs FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view their embedding_jobs"
ON embedding_jobs FOR SELECT TO authenticated
USING (
    document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
    ) OR
    NOT EXISTS (
        SELECT 1 FROM documents WHERE id = embedding_jobs.document_id AND user_id IS NOT NULL
    )
);

-- ═══════════════════════════════════════════════════════════════
-- Ende Vector Schema Extension
-- ═══════════════════════════════════════════════════════════════
