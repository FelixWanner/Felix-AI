-- ═══════════════════════════════════════════════════════════════
-- Life OS - AI Copilot Module Schema
-- Migration: 00006_ai_copilot_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- AI Insights (Generierte Insights)
-- ───────────────────────────────────────────────────────────────
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

CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_read ON ai_insights(is_read);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at);

-- ───────────────────────────────────────────────────────────────
-- Telegram Messages (Nachrichtenverlauf)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE telegram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_message_id BIGINT,
    chat_id BIGINT,
    direction VARCHAR(20), -- incoming, outgoing
    message_type VARCHAR(20), -- text, voice, command, photo, document
    content TEXT,
    transcription TEXT, -- Für Voice Messages
    intent_detected VARCHAR(100),
    entities_extracted JSONB,
    action_taken TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_messages_chat ON telegram_messages(chat_id);
CREATE INDEX idx_telegram_messages_direction ON telegram_messages(direction);
CREATE INDEX idx_telegram_messages_created ON telegram_messages(created_at);
CREATE INDEX idx_telegram_messages_intent ON telegram_messages(intent_detected);

-- ───────────────────────────────────────────────────────────────
-- Telegram Reminders (Erinnerungen)
-- ───────────────────────────────────────────────────────────────
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

CREATE INDEX idx_telegram_reminders_active ON telegram_reminders(is_active);
CREATE INDEX idx_telegram_reminders_time ON telegram_reminders(scheduled_time);

-- ───────────────────────────────────────────────────────────────
-- Morning Briefings (Generierte Briefings)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE morning_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,

    -- Weather & Calendar
    weather_summary TEXT,
    calendar_summary TEXT,
    meetings_count INTEGER,

    -- Tasks
    priority_tasks JSONB,
    overdue_tasks_count INTEGER,
    inbox_count INTEGER,

    -- Health
    sleep_summary TEXT,
    readiness_score INTEGER,
    readiness_recommendation VARCHAR(100),
    workout_planned TEXT,

    -- Wealth
    account_alerts JSONB,
    upcoming_payments JSONB,

    -- Goals
    active_goals_summary JSONB,

    -- AI Generated
    motivational_message TEXT,
    energy_based_suggestions JSONB,
    full_briefing_text TEXT,

    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_morning_briefings_date ON morning_briefings(date);

-- ───────────────────────────────────────────────────────────────
-- Conversation Context (für AI Kontext)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id BIGINT NOT NULL,
    context_type VARCHAR(50), -- current_topic, user_preference, pending_action
    key VARCHAR(100),
    value JSONB,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('conversation_context');
CREATE INDEX idx_conversation_context_chat ON conversation_context(chat_id);
CREATE INDEX idx_conversation_context_type ON conversation_context(context_type);

-- ───────────────────────────────────────────────────────────────
-- AI Prompts (Gespeicherte Prompts)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    prompt_template TEXT NOT NULL,
    input_variables JSONB, -- Liste der erwarteten Variablen
    model VARCHAR(50) DEFAULT 'gpt-4o',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_updated_at_trigger('ai_prompts');
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(is_active);

-- ───────────────────────────────────────────────────────────────
-- AI Usage Logs (API Nutzung tracken)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID REFERENCES ai_prompts(id),
    model VARCHAR(50),
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10,6),
    latency_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_prompt ON ai_usage_logs(prompt_id);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_model ON ai_usage_logs(model);

-- ───────────────────────────────────────────────────────────────
-- Notifications Queue (Ausstehende Benachrichtigungen)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE notifications_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(50) NOT NULL, -- telegram, email, push
    recipient VARCHAR(255),
    title VARCHAR(500),
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_queue_status ON notifications_queue(status);
CREATE INDEX idx_notifications_queue_scheduled ON notifications_queue(scheduled_for);
CREATE INDEX idx_notifications_queue_channel ON notifications_queue(channel);

-- ───────────────────────────────────────────────────────────────
-- Row Level Security
-- ───────────────────────────────────────────────────────────────

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON ai_insights FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON telegram_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON telegram_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON morning_briefings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON conversation_context FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ai_prompts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ai_usage_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
CREATE POLICY "Authenticated read access" ON ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON telegram_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON telegram_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON morning_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON conversation_context FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON ai_prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON ai_usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON notifications_queue FOR SELECT TO authenticated USING (true);

-- ───────────────────────────────────────────────────────────────
-- Initial AI Prompts
-- ───────────────────────────────────────────────────────────────

INSERT INTO ai_prompts (name, category, description, prompt_template, input_variables) VALUES
('morning_briefing', 'copilot', 'Generates the daily morning briefing',
'Du bist ein persönlicher AI-Assistent für einen Immobilieninvestor und Unternehmer.
Erstelle ein prägnantes Morning Briefing auf Deutsch für den {{date}}.

Wetter: {{weather}}
Termine heute: {{calendar}}
Offene Aufgaben: {{tasks}}
Schlaf: {{sleep_data}}
Readiness: {{readiness}}
Kontostände-Alerts: {{account_alerts}}
Aktive Ziele: {{goals}}

Erstelle ein motivierendes, actionable Briefing mit:
1. Kurze Zusammenfassung des Tages
2. Top 3 Prioritäten
3. Energie-basierte Empfehlungen
4. Eine motivierende Botschaft

Halte es unter 500 Wörtern.',
'["date", "weather", "calendar", "tasks", "sleep_data", "readiness", "account_alerts", "goals"]'),

('intent_detection', 'telegram', 'Detects user intent from Telegram messages',
'Analysiere die folgende Nachricht und extrahiere:
1. Intent (task_create, expense_log, weight_log, mood_log, water_log, habit_complete, supplement_log, query, reminder, unknown)
2. Entities (Beträge, Kategorien, Namen, Zeiten, etc.)

Nachricht: {{message}}

Antworte im JSON-Format:
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "entities": {...},
  "suggested_response": "..."
}',
'["message"]'),

('weekly_review_summary', 'copilot', 'Generates weekly review summary',
'Erstelle einen Wochenrückblick auf Deutsch basierend auf:

Woche: KW{{week}} {{year}}
Erledigte Aufgaben: {{tasks_completed}}
Meetings: {{meetings}}
Billable Hours: {{billable_hours}}
Schlaf-Durchschnitt: {{avg_sleep}}
Workouts: {{workouts}}
Habit-Rate: {{habit_rate}}%
Ziel-Fortschritt: {{goal_progress}}

Erstelle eine reflektive Zusammenfassung mit:
1. Größte Erfolge
2. Herausforderungen
3. Learnings
4. Fokus für nächste Woche

Sei ehrlich und konstruktiv.',
'["week", "year", "tasks_completed", "meetings", "billable_hours", "avg_sleep", "workouts", "habit_rate", "goal_progress"]'),

('document_qa', 'rag', 'Answers questions about documents using RAG',
'Du bist ein Experte für Immobilien und Finanzdokumente.
Beantworte die Frage basierend auf dem bereitgestellten Kontext.

Kontext aus Dokumenten:
{{context}}

Frage: {{question}}

Antworte präzise und verweise auf relevante Dokumente.
Wenn die Antwort nicht im Kontext ist, sage das ehrlich.',
'["context", "question"]'),

('insight_generation', 'copilot', 'Generates proactive insights from data',
'Analysiere die folgenden Daten und generiere actionable Insights:

Daten-Typ: {{data_type}}
Zeitraum: {{period}}
Daten: {{data}}

Identifiziere:
1. Positive Trends
2. Warnzeichen
3. Chancen
4. Konkrete Handlungsempfehlungen

Priorisiere nach Wichtigkeit und Dringlichkeit.',
'["data_type", "period", "data"]');

-- ───────────────────────────────────────────────────────────────
-- Initial Telegram Reminders
-- ───────────────────────────────────────────────────────────────

INSERT INTO telegram_reminders (reminder_type, scheduled_time, message_template, conditions) VALUES
('morning_briefing', '06:30:00', 'Guten Morgen! ☀️ Dein Morning Briefing ist bereit.', '{}'),
('supplement_morning', '07:00:00', '💊 Zeit für deine Morgen-Supplements!', '{"check_supplements": true}'),
('water_reminder', '10:00:00', '💧 Trinkerinnerung: Hast du schon genug Wasser getrunken?', '{}'),
('water_reminder', '14:00:00', '💧 Nachmittags-Trinkerinnerung!', '{}'),
('supplement_evening', '20:00:00', '💊 Zeit für deine Abend-Supplements!', '{"check_supplements": true}'),
('daily_reflection', '21:00:00', '📝 Zeit für deine Tagesreflexion. Wie war dein Tag?', '{}'),
('weekly_review', '18:00:00', '📊 Wochenrückblick: Zeit deine Woche zu reflektieren!', '{"day_of_week": 0}');

-- ═══════════════════════════════════════════════════════════════
-- Ende AI Copilot Schema
-- ═══════════════════════════════════════════════════════════════
