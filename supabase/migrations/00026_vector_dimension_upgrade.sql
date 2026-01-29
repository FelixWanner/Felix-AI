-- ═══════════════════════════════════════════════════════════════
-- Life OS - Vector Dimension Upgrade
-- Migration: 00026_vector_dimension_upgrade.sql
-- ═══════════════════════════════════════════════════════════════
-- HINWEIS: Dimension bleibt 1536 (pgvector 0.8.0 hat 2000 Dimension Limit)
-- Für OpenAI text-embedding-3-large mit dimensions=1536 Parameter
-- ═══════════════════════════════════════════════════════════════
--
-- WICHTIG: Diese Migration:
-- 1. Erstellt ein Backup der alten Embeddings
-- 2. Trunciert die document_embeddings Tabelle
-- 3. Ändert die Dimension auf 1536
-- 4. Markiert alle Dokumente als nicht-indexiert
-- 5. Erstellt einen neuen HNSW Index (besser für 1536 Dims)
--
-- Nach der Migration müssen alle Embeddings neu generiert werden!
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. Backup der alten Embeddings (falls vorhanden)
-- ───────────────────────────────────────────────────────────────

-- Prüfe ob Daten existieren und erstelle Backup
DO $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count FROM document_embeddings;

    IF embedding_count > 0 THEN
        -- Erstelle Backup-Tabelle mit Timestamp
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS document_embeddings_backup_1536_%s AS SELECT * FROM document_embeddings',
            to_char(NOW(), 'YYYYMMDD_HH24MI')
        );

        RAISE NOTICE 'Backup erstellt mit % Embeddings', embedding_count;
    ELSE
        RAISE NOTICE 'Keine Embeddings zum Sichern vorhanden';
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 2. Alten IVFFLAT Index löschen
-- ───────────────────────────────────────────────────────────────

-- Lösche den alten Vector-Index (falls vorhanden)
DROP INDEX IF EXISTS idx_document_embeddings_vector;
DROP INDEX IF EXISTS idx_document_embeddings_vector_hnsw;

-- ───────────────────────────────────────────────────────────────
-- 3. Tabelle leeren und Spalte ändern
-- ───────────────────────────────────────────────────────────────

-- Truncate der Embeddings-Tabelle (Backup existiert bereits)
TRUNCATE TABLE document_embeddings;

-- Ändere die Dimension der embedding-Spalte
ALTER TABLE document_embeddings
    ALTER COLUMN embedding TYPE vector(1536);

-- ───────────────────────────────────────────────────────────────
-- 4. Alle Dokumente als nicht-indexiert markieren
-- ───────────────────────────────────────────────────────────────

UPDATE documents
SET
    is_indexed = FALSE,
    total_chunks = 0,
    embedding_model = NULL,
    embedding_dimensions = NULL,
    updated_at = NOW();

-- ───────────────────────────────────────────────────────────────
-- 5. Neuen HNSW Index erstellen
-- ───────────────────────────────────────────────────────────────

-- HNSW ist besser für höhere Dimensionen (1536):
-- - Bessere Recall-Genauigkeit (95-99%)
-- - Inkrementelle Updates (kein Retraining nötig wie bei IVFFLAT)
-- - Schnellere Queries bei großen Datenmengen
--
-- Parameter:
-- - m = 16: Anzahl der Verbindungen pro Knoten (Standard: 16)
-- - ef_construction = 64: Höher = bessere Qualität, langsamer Build

CREATE INDEX idx_document_embeddings_vector_hnsw
ON document_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Kommentar zum Index
COMMENT ON INDEX idx_document_embeddings_vector_hnsw IS
    'HNSW Index für 1536-dimensionale Embeddings (text-embedding-3-large). '
    'Ersetzt den alten IVFFLAT Index für bessere Skalierung.';

-- ───────────────────────────────────────────────────────────────
-- 6. Hilfsfunktion für Index-Maintenance
-- ───────────────────────────────────────────────────────────────

-- Funktion zum Setzen der ef_search Parameter für bessere Recall
CREATE OR REPLACE FUNCTION set_hnsw_ef_search(ef_value INTEGER DEFAULT 40)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- ef_search bestimmt die Suchqualität:
    -- - Höher = bessere Recall, langsamer
    -- - Standard: 40 (guter Kompromiss)
    -- - Für Produktiv: 40-100
    EXECUTE format('SET hnsw.ef_search = %s', ef_value);
END;
$$;

COMMENT ON FUNCTION set_hnsw_ef_search IS
    'Setzt den ef_search Parameter für HNSW Queries. '
    'Höhere Werte = bessere Recall, aber langsamere Queries.';

-- ───────────────────────────────────────────────────────────────
-- 7. Statistiken und Validierung
-- ───────────────────────────────────────────────────────────────

-- View für Embedding-Statistiken
CREATE OR REPLACE VIEW v_embedding_migration_status AS
SELECT
    (SELECT COUNT(*) FROM documents) AS total_documents,
    (SELECT COUNT(*) FROM documents WHERE is_indexed = true) AS indexed_documents,
    (SELECT COUNT(*) FROM documents WHERE is_indexed = false) AS pending_documents,
    (SELECT COUNT(*) FROM document_embeddings) AS total_embeddings,
    (SELECT atttypmod FROM pg_attribute
     WHERE attrelid = 'document_embeddings'::regclass
     AND attname = 'embedding') AS current_vector_dimension,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_name LIKE 'document_embeddings_backup_1536_%') AS backup_tables_count;

-- Logging-Tabelle für Migrations-Historie
CREATE TABLE IF NOT EXISTS vector_migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100) NOT NULL,
    old_dimension INTEGER,
    new_dimension INTEGER,
    documents_affected INTEGER,
    embeddings_backed_up INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    executed_by VARCHAR(100) DEFAULT current_user,
    notes TEXT
);

-- Log dieser Migration
INSERT INTO vector_migration_log (migration_name, old_dimension, new_dimension, documents_affected, embeddings_backed_up, notes)
SELECT
    '00026_vector_dimension_upgrade',
    1536,
    1536,
    (SELECT COUNT(*) FROM documents),
    (SELECT COUNT(*) FROM document_embeddings),
    'Upgrade auf text-embedding-3-large. HNSW Index erstellt.';

-- ───────────────────────────────────────────────────────────────
-- 8. RLS für neue Tabelle
-- ───────────────────────────────────────────────────────────────

ALTER TABLE vector_migration_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to vector_migration_log"
ON vector_migration_log FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read vector_migration_log"
ON vector_migration_log FOR SELECT TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- WICHTIGE HINWEISE FÜR NACH DER MIGRATION:
-- ═══════════════════════════════════════════════════════════════
--
-- 1. Alle bestehenden Embeddings wurden gesichert in:
--    document_embeddings_backup_1536_YYYYMMDD_HHMI
--
-- 2. Die embedding-Spalte ist jetzt vector(1536)
--
-- 3. ALLE DOKUMENTE müssen neu embedded werden:
--    - Setze is_indexed = false für alle Dokumente (bereits getan)
--    - Starte den Embedding-Job in n8n
--
-- 4. Verwendetes Embedding-Modell: text-embedding-3-large
--    - API: OpenAI
--    - Dimensionen: 1536
--    - Kosten: ~$0.13 pro 1M Tokens
--
-- 5. Speicherabschätzung (50.000 Dokumente):
--    - ~500.000 Embeddings (10 Chunks/Dokument)
--    - ~6 GB für Vektoren (1536 * 4 bytes * 500.000)
--    - ~10-15 GB gesamt mit Indexes
--
-- 6. Backup-Tabellen können nach erfolgreicher Re-Indexierung
--    gelöscht werden mit:
--    DROP TABLE document_embeddings_backup_1536_YYYYMMDD_HHMI;
--
-- ═══════════════════════════════════════════════════════════════
