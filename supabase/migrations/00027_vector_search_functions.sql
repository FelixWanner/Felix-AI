-- ═══════════════════════════════════════════════════════════════
-- Life OS - Vector Search Functions
-- Migration: 00027_vector_search_functions.sql
-- ═══════════════════════════════════════════════════════════════
-- Neue Suchfunktionen für erweiterte RAG-Funktionalität:
-- - Hybrid-Suche (Vector + Full-Text)
-- - Multi-Query-Expansion
-- - Kategorie-basierte Suche
-- - Chat-History-Suche
-- - Kontext-Retrieval
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. Alte Funktionen aktualisieren (3072 Dimensionen)
-- ───────────────────────────────────────────────────────────────

-- Aktualisierte match_documents Funktion (abwärtskompatibel)
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
    WHERE de.embedding IS NOT NULL
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- 2. Hybrid-Suche (Vector + Full-Text)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(1536),
    query_text TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    rrf_k INTEGER DEFAULT 60,
    category_filter document_category DEFAULT NULL,
    user_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    category document_category,
    chunk_index INTEGER,
    content TEXT,
    page_number INTEGER,
    section_title VARCHAR(500),
    vector_similarity FLOAT,
    fts_rank FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    fts_query tsquery;
BEGIN
    -- Konvertiere Text zu tsquery für Full-Text-Search
    IF query_text IS NOT NULL AND query_text != '' THEN
        fts_query := plainto_tsquery('german', query_text);
    END IF;

    RETURN QUERY
    WITH vector_results AS (
        -- Vector Similarity Search
        SELECT
            de.id,
            1 - (de.embedding <=> query_embedding) AS similarity,
            ROW_NUMBER() OVER (ORDER BY de.embedding <=> query_embedding) AS vector_rank
        FROM document_embeddings de
        JOIN documents d ON d.id = de.document_id
        WHERE de.embedding IS NOT NULL
          AND 1 - (de.embedding <=> query_embedding) > match_threshold
          AND (category_filter IS NULL OR d.category = category_filter)
          AND (user_filter IS NULL OR d.user_id = user_filter OR d.user_id IS NULL)
        ORDER BY de.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    fts_results AS (
        -- Full-Text Search (nur wenn query_text vorhanden)
        SELECT
            de.id,
            ts_rank(de.fts_content, fts_query) AS rank,
            ROW_NUMBER() OVER (ORDER BY ts_rank(de.fts_content, fts_query) DESC) AS fts_rank
        FROM document_embeddings de
        JOIN documents d ON d.id = de.document_id
        WHERE fts_query IS NOT NULL
          AND de.fts_content @@ fts_query
          AND (category_filter IS NULL OR d.category = category_filter)
          AND (user_filter IS NULL OR d.user_id = user_filter OR d.user_id IS NULL)
        ORDER BY ts_rank(de.fts_content, fts_query) DESC
        LIMIT match_count * 2
    ),
    combined AS (
        -- Reciprocal Rank Fusion (RRF)
        SELECT
            COALESCE(v.id, f.id) AS id,
            COALESCE(v.similarity, 0) AS vector_sim,
            COALESCE(f.rank, 0) AS fts_r,
            -- RRF Score: 1/(k + rank_vector) + 1/(k + rank_fts)
            COALESCE(1.0 / (rrf_k + v.vector_rank), 0) +
            COALESCE(1.0 / (rrf_k + f.fts_rank), 0) AS rrf_score
        FROM vector_results v
        FULL OUTER JOIN fts_results f ON v.id = f.id
    )
    SELECT
        de.id,
        de.document_id,
        d.title AS document_title,
        d.document_type,
        d.category,
        de.chunk_index,
        de.content,
        de.page_number,
        de.section_title,
        c.vector_sim AS vector_similarity,
        c.fts_r AS fts_rank,
        c.rrf_score AS combined_score
    FROM combined c
    JOIN document_embeddings de ON de.id = c.id
    JOIN documents d ON d.id = de.document_id
    ORDER BY c.rrf_score DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_embeddings IS
    'Hybrid-Suche kombiniert Vector Similarity mit Full-Text Search via Reciprocal Rank Fusion (RRF). '
    'Unterstützt Filter nach Kategorie und User.';

-- ───────────────────────────────────────────────────────────────
-- 3. Kategorie-basierte Suche
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_documents_by_category(
    query_embedding vector(1536),
    filter_category document_category,
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
    page_number INTEGER,
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
        de.page_number,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE d.category = filter_category
      AND de.embedding IS NOT NULL
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- 4. Chat-History-Suche (optimiert für Konversationen)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_chat_history(
    query_embedding vector(1536),
    user_filter UUID DEFAULT NULL,
    time_window_days INTEGER DEFAULT 30,
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    chunk_index INTEGER,
    content TEXT,
    created_at TIMESTAMPTZ,
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
        de.chunk_index,
        de.content,
        d.created_at,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE d.category = 'chat'
      AND de.embedding IS NOT NULL
      AND d.created_at >= NOW() - (time_window_days || ' days')::INTERVAL
      AND (user_filter IS NULL OR d.user_id = user_filter OR d.user_id IS NULL)
      AND 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_chat_history IS
    'Suche in Chat-Verläufen mit optionalem Zeitfenster. '
    'Niedrigerer Threshold (0.65) für besseren Recall bei Konversationen.';

-- ───────────────────────────────────────────────────────────────
-- 5. Multi-Query-Expansion
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_with_multiple_queries(
    query_embeddings vector(1536)[],
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    category_filter document_category DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    chunk_index INTEGER,
    content TEXT,
    max_similarity FLOAT,
    avg_similarity FLOAT,
    query_hits INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH query_results AS (
        SELECT
            de.id,
            de.document_id,
            1 - (de.embedding <=> q.query_vec) AS similarity
        FROM document_embeddings de
        JOIN documents d ON d.id = de.document_id
        CROSS JOIN LATERAL unnest(query_embeddings) AS q(query_vec)
        WHERE de.embedding IS NOT NULL
          AND 1 - (de.embedding <=> q.query_vec) > match_threshold
          AND (category_filter IS NULL OR d.category = category_filter)
    ),
    aggregated AS (
        SELECT
            qr.id,
            qr.document_id,
            MAX(qr.similarity) AS max_sim,
            AVG(qr.similarity) AS avg_sim,
            COUNT(*)::INTEGER AS hits
        FROM query_results qr
        GROUP BY qr.id, qr.document_id
    )
    SELECT
        a.id,
        a.document_id,
        d.title AS document_title,
        d.document_type,
        de.chunk_index,
        de.content,
        a.max_sim AS max_similarity,
        a.avg_sim AS avg_similarity,
        a.hits AS query_hits
    FROM aggregated a
    JOIN document_embeddings de ON de.id = a.id
    JOIN documents d ON d.id = de.document_id
    ORDER BY a.hits DESC, a.max_sim DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_with_multiple_queries IS
    'Multi-Query-Expansion: Sucht mit mehreren Query-Embeddings (z.B. Original + Umformulierungen). '
    'Rankt Ergebnisse nach Anzahl der Treffer und maximaler Similarity.';

-- ───────────────────────────────────────────────────────────────
-- 6. Reine Full-Text-Suche
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_documents_fts(
    query_text TEXT,
    match_count INT DEFAULT 10,
    category_filter document_category DEFAULT NULL,
    user_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title VARCHAR(500),
    document_type VARCHAR(50),
    category document_category,
    chunk_index INTEGER,
    content TEXT,
    headline TEXT,
    rank FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    fts_query tsquery;
BEGIN
    fts_query := plainto_tsquery('german', query_text);

    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        d.title AS document_title,
        d.document_type,
        d.category,
        de.chunk_index,
        de.content,
        ts_headline('german', de.content, fts_query,
            'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=50'
        ) AS headline,
        ts_rank(de.fts_content, fts_query) AS rank
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    WHERE de.fts_content @@ fts_query
      AND (category_filter IS NULL OR d.category = category_filter)
      AND (user_filter IS NULL OR d.user_id = user_filter OR d.user_id IS NULL)
    ORDER BY ts_rank(de.fts_content, fts_query) DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_documents_fts IS
    'Reine Full-Text-Suche ohne Embeddings. '
    'Gibt Treffer mit hervorgehobenen Suchbegriffen (headline) zurück.';

-- ───────────────────────────────────────────────────────────────
-- 7. Kontext-Retrieval (umgebende Chunks laden)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_chunk_context(
    p_chunk_id UUID,
    context_before INT DEFAULT 1,
    context_after INT DEFAULT 1
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_index INTEGER,
    content TEXT,
    is_target BOOLEAN,
    relative_position INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_document_id UUID;
    v_chunk_index INTEGER;
BEGIN
    -- Hole das Ziel-Chunk
    SELECT de.document_id, de.chunk_index
    INTO v_document_id, v_chunk_index
    FROM document_embeddings de
    WHERE de.id = p_chunk_id;

    IF v_document_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.chunk_index,
        de.content,
        de.id = p_chunk_id AS is_target,
        de.chunk_index - v_chunk_index AS relative_position
    FROM document_embeddings de
    WHERE de.document_id = v_document_id
      AND de.chunk_index BETWEEN (v_chunk_index - context_before) AND (v_chunk_index + context_after)
    ORDER BY de.chunk_index;
END;
$$;

COMMENT ON FUNCTION get_chunk_context IS
    'Lädt umgebende Chunks für mehr Kontext. '
    'Nützlich für RAG wenn ein einzelner Chunk nicht genug Kontext liefert.';

-- ───────────────────────────────────────────────────────────────
-- 8. Statistik-Funktionen
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
    total_documents BIGINT,
    indexed_documents BIGINT,
    pending_documents BIGINT,
    total_chunks BIGINT,
    avg_chunks_per_document NUMERIC,
    total_tokens_estimated BIGINT,
    documents_by_category JSONB,
    chunks_by_chunk_type JSONB,
    embedding_model_used VARCHAR(100),
    embedding_dimensions INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM documents)::BIGINT AS total_documents,
        (SELECT COUNT(*) FROM documents WHERE is_indexed = true)::BIGINT AS indexed_documents,
        (SELECT COUNT(*) FROM documents WHERE is_indexed = false)::BIGINT AS pending_documents,
        (SELECT COUNT(*) FROM document_embeddings)::BIGINT AS total_chunks,
        (SELECT ROUND(AVG(total_chunks), 2) FROM documents WHERE total_chunks > 0) AS avg_chunks_per_document,
        (SELECT COALESCE(SUM(total_tokens), 0) FROM documents)::BIGINT AS total_tokens_estimated,
        (SELECT jsonb_object_agg(category, cnt)
         FROM (SELECT category, COUNT(*) AS cnt FROM documents WHERE category IS NOT NULL GROUP BY category) t
        ) AS documents_by_category,
        (SELECT jsonb_object_agg(chunk_type, cnt)
         FROM (SELECT chunk_type, COUNT(*) AS cnt FROM document_embeddings GROUP BY chunk_type) t
        ) AS chunks_by_chunk_type,
        (SELECT embedding_model FROM documents WHERE embedding_model IS NOT NULL LIMIT 1) AS embedding_model_used,
        (SELECT embedding_dimensions FROM documents WHERE embedding_dimensions IS NOT NULL LIMIT 1) AS embedding_dimensions;
END;
$$;

COMMENT ON FUNCTION get_embedding_stats IS
    'Gibt Statistiken über die Vector-Datenbank zurück. '
    'Nützlich für Monitoring und Kapazitätsplanung.';

-- ───────────────────────────────────────────────────────────────
-- 9. Dokument-Ähnlichkeitssuche
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_similar_documents(
    source_document_id UUID,
    match_threshold FLOAT DEFAULT 0.8,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    document_id UUID,
    title VARCHAR(500),
    document_type VARCHAR(50),
    category document_category,
    avg_similarity FLOAT,
    matching_chunks INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH source_chunks AS (
        SELECT embedding
        FROM document_embeddings
        WHERE document_id = source_document_id
          AND embedding IS NOT NULL
        LIMIT 5  -- Nur erste 5 Chunks für Performance
    ),
    similarities AS (
        SELECT
            de.document_id,
            1 - (de.embedding <=> sc.embedding) AS similarity
        FROM document_embeddings de
        CROSS JOIN source_chunks sc
        WHERE de.document_id != source_document_id
          AND de.embedding IS NOT NULL
          AND 1 - (de.embedding <=> sc.embedding) > match_threshold
    )
    SELECT
        s.document_id,
        d.title,
        d.document_type,
        d.category,
        AVG(s.similarity)::FLOAT AS avg_similarity,
        COUNT(*)::INTEGER AS matching_chunks
    FROM similarities s
    JOIN documents d ON d.id = s.document_id
    GROUP BY s.document_id, d.title, d.document_type, d.category
    ORDER BY AVG(s.similarity) DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION find_similar_documents IS
    'Findet ähnliche Dokumente basierend auf Embedding-Ähnlichkeit. '
    'Nützlich für "Ähnliche Dokumente" Feature.';

-- ───────────────────────────────────────────────────────────────
-- 10. Cleanup alter Funktionen mit 1536er Signatur
-- ───────────────────────────────────────────────────────────────

-- Lösche alte Funktionen mit 1536-Dimension Signatur (falls vorhanden)
DROP FUNCTION IF EXISTS match_documents(vector(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS match_documents_by_property(vector(1536), UUID, FLOAT, INT);
DROP FUNCTION IF EXISTS match_documents_by_type(vector(1536), VARCHAR, FLOAT, INT);

-- ═══════════════════════════════════════════════════════════════
-- Ende Vector Search Functions
-- ═══════════════════════════════════════════════════════════════
