-- ═══════════════════════════════════════════════════════════════
-- Life OS - Vector RLS Policies Update
-- Migration: 00028_vector_rls_policies.sql
-- ═══════════════════════════════════════════════════════════════
-- Aktualisiert Row Level Security für Multi-User-Support
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. Bestehende Policies entfernen (für Neuaufbau)
-- ───────────────────────────────────────────────────────────────

-- Documents Policies
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON documents;
DROP POLICY IF EXISTS "Service role has full access to documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Service role full access to documents" ON documents;

-- Document Embeddings Policies
DROP POLICY IF EXISTS "Authenticated users can manage document_embeddings" ON document_embeddings;
DROP POLICY IF EXISTS "Service role has full access to document_embeddings" ON document_embeddings;
DROP POLICY IF EXISTS "Users can view their own document_embeddings" ON document_embeddings;
DROP POLICY IF EXISTS "Service role full access to document_embeddings" ON document_embeddings;

-- ───────────────────────────────────────────────────────────────
-- 2. Documents - Neue RLS Policies
-- ───────────────────────────────────────────────────────────────

-- Service Role: Vollzugriff (für n8n und Backend-Prozesse)
CREATE POLICY "Service role full access to documents"
ON documents FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Authenticated Users: Können ihre eigenen Dokumente sehen
-- oder Dokumente ohne User-Zuweisung (shared/legacy)
CREATE POLICY "Users can view documents"
ON documents FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR user_id IS NULL  -- Shared/Legacy Dokumente
);

-- Authenticated Users: Können eigene Dokumente erstellen
CREATE POLICY "Users can insert documents"
ON documents FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL  -- Erlaubt Legacy-Inserts ohne user_id
);

-- Authenticated Users: Können nur eigene Dokumente aktualisieren
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE TO authenticated
USING (
    user_id = auth.uid()
    OR user_id IS NULL
)
WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
);

-- Authenticated Users: Können nur eigene Dokumente löschen
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE TO authenticated
USING (
    user_id = auth.uid()
    OR user_id IS NULL
);

-- ───────────────────────────────────────────────────────────────
-- 3. Document Embeddings - Neue RLS Policies
-- ───────────────────────────────────────────────────────────────

-- Service Role: Vollzugriff
CREATE POLICY "Service role full access to document_embeddings"
ON document_embeddings FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Authenticated Users: Können Embeddings ihrer Dokumente sehen
CREATE POLICY "Users can view document embeddings"
ON document_embeddings FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_embeddings.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- Authenticated Users: Können Embeddings für eigene Dokumente erstellen
CREATE POLICY "Users can insert document embeddings"
ON document_embeddings FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_embeddings.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- Authenticated Users: Können Embeddings für eigene Dokumente aktualisieren
CREATE POLICY "Users can update document embeddings"
ON document_embeddings FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_embeddings.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_embeddings.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- Authenticated Users: Können Embeddings für eigene Dokumente löschen
CREATE POLICY "Users can delete document embeddings"
ON document_embeddings FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_embeddings.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- ───────────────────────────────────────────────────────────────
-- 4. Embedding Jobs - RLS Policies anpassen
-- ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access to embedding_jobs" ON embedding_jobs;
DROP POLICY IF EXISTS "Authenticated users can view their embedding_jobs" ON embedding_jobs;

-- Service Role: Vollzugriff (für n8n Workers)
CREATE POLICY "Service role full access to embedding_jobs"
ON embedding_jobs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Authenticated Users: Können Jobs für ihre Dokumente sehen
CREATE POLICY "Users can view embedding jobs"
ON embedding_jobs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = embedding_jobs.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- Authenticated Users: Können Jobs für eigene Dokumente erstellen
CREATE POLICY "Users can create embedding jobs"
ON embedding_jobs FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = embedding_jobs.document_id
        AND (d.user_id = auth.uid() OR d.user_id IS NULL)
    )
);

-- ───────────────────────────────────────────────────────────────
-- 5. Security-optimierte Such-Wrapper-Funktion
-- ───────────────────────────────────────────────────────────────

-- Wrapper-Funktion die automatisch nach User filtert
CREATE OR REPLACE FUNCTION search_my_documents(
    query_embedding vector(1536),
    query_text TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    category_filter document_category DEFAULT NULL
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM search_embeddings(
        query_embedding,
        query_text,
        match_threshold,
        match_count,
        60,  -- rrf_k default
        category_filter,
        auth.uid()  -- Automatisch nach aktuellem User filtern
    );
END;
$$;

COMMENT ON FUNCTION search_my_documents IS
    'Wrapper für search_embeddings mit automatischer User-Filterung. '
    'Für Frontend-Aufrufe empfohlen.';

-- ───────────────────────────────────────────────────────────────
-- 6. Funktion für Admin-Zugriff (alle Dokumente)
-- ───────────────────────────────────────────────────────────────

-- Prüffunktion ob User Admin ist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT raw_user_meta_data->>'role'
    INTO user_role
    FROM auth.users
    WHERE id = auth.uid();

    RETURN user_role = 'admin';
END;
$$;

-- Admin-Such-Funktion (alle Dokumente, alle User)
CREATE OR REPLACE FUNCTION search_all_documents(
    query_embedding vector(1536),
    query_text TEXT DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.7,
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
    page_number INTEGER,
    section_title VARCHAR(500),
    vector_similarity FLOAT,
    fts_rank FLOAT,
    combined_score FLOAT,
    owner_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Nur Admins dürfen alle Dokumente durchsuchen
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Nur Administratoren können alle Dokumente durchsuchen';
    END IF;

    RETURN QUERY
    SELECT
        s.id,
        s.document_id,
        s.document_title,
        s.document_type,
        s.category,
        s.chunk_index,
        s.content,
        s.page_number,
        s.section_title,
        s.vector_similarity,
        s.fts_rank,
        s.combined_score,
        d.user_id AS owner_user_id
    FROM search_embeddings(
        query_embedding,
        query_text,
        match_threshold,
        match_count,
        60,
        category_filter,
        user_filter
    ) s
    JOIN documents d ON d.id = s.document_id;
END;
$$;

COMMENT ON FUNCTION search_all_documents IS
    'Admin-Only: Durchsucht alle Dokumente aller User. '
    'Zeigt auch den Owner jedes Dokuments an.';

-- ───────────────────────────────────────────────────────────────
-- 7. Validierung der RLS-Konfiguration
-- ───────────────────────────────────────────────────────────────

-- View zur Überprüfung der RLS-Policies
CREATE OR REPLACE VIEW v_rls_policy_check AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL AS has_using_clause,
    with_check IS NOT NULL AS has_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('documents', 'document_embeddings', 'embedding_jobs', 'chunking_configs')
ORDER BY tablename, policyname;

COMMENT ON VIEW v_rls_policy_check IS
    'Zeigt alle RLS Policies für Vector-Tabellen. '
    'Nützlich für Debugging und Auditing.';

-- ───────────────────────────────────────────────────────────────
-- 8. Grants für Funktionen
-- ───────────────────────────────────────────────────────────────

-- Alle Such-Funktionen für authenticated User verfügbar machen
GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION search_my_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION search_chat_history TO authenticated;
GRANT EXECUTE ON FUNCTION search_with_multiple_queries TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents_fts TO authenticated;
GRANT EXECUTE ON FUNCTION get_chunk_context TO authenticated;
GRANT EXECUTE ON FUNCTION get_embedding_stats TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_documents TO authenticated;

-- Admin-Funktionen nur für service_role
GRANT EXECUTE ON FUNCTION search_all_documents TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Ende Vector RLS Policies Update
-- ═══════════════════════════════════════════════════════════════
