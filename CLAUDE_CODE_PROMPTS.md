# Claude Code Prompts für Life OS

Diese Datei enthält ready-to-use Prompts für die Entwicklung mit Claude Code.
Kopiere die Prompts direkt in Claude Code um die jeweiligen Komponenten zu erstellen.

---

## 🚀 Initiales Setup

### Prompt 1: Projektstruktur erstellen

```
Lies die Dateien SPEC.md und PROJECT_STRUCTURE.md in diesem Verzeichnis.

Erstelle die komplette Projektstruktur gemäß PROJECT_STRUCTURE.md:
1. Alle Ordner anlegen
2. .gitignore erstellen
3. README.md erstellen

Erstelle NOCH KEINEN Code, nur die Ordnerstruktur und Basis-Dateien.
```

### Prompt 2: Docker Setup vervollständigen

```
Basierend auf der SPEC.md und dem vorhandenen docker-compose.yml:

1. Erstelle die fehlende Kong-Konfiguration unter supabase/kong.yml
2. Überprüfe den docker-compose.yml auf Vollständigkeit
3. Erstelle ein docker-compose.override.yml für lokale Entwicklung
4. Erstelle scripts/setup.sh das:
   - Prüft ob Docker installiert ist
   - .env aus .env.example kopiert (falls nicht vorhanden)
   - JWT Secrets generiert
   - Docker Compose startet

Teste den Stack mit: docker compose up -d
```

---

## 💾 Phase 1: Supabase Schema

### Prompt 3: Basis-Schema erstellen

```
Basierend auf SPEC.md, erstelle die SQL-Migration supabase/migrations/00001_initial_schema.sql:

1. Extensions aktivieren:
   - uuid-ossp
   - pgcrypto
   - pg_trgm (für Suche)
   - vector (für Embeddings)

2. Basis-Tabellen erstellen:
   - users (Supabase Auth wird genutzt, aber custom fields)
   - audit_logs
   - sync_status

3. Row Level Security (RLS) aktivieren

4. Trigger für updated_at erstellen

Halte dich exakt an die Tabellen-Definitionen in SPEC.md.
```

### Prompt 4: Wealth Module Schema

```
Erstelle supabase/migrations/00002_wealth_module.sql basierend auf SPEC.md:

Tabellen in dieser Reihenfolge (wegen Foreign Keys):
1. banks
2. contacts
3. contact_specialties
4. properties
5. contact_properties
6. accounts
7. units
8. tenants
9. loans
10. loan_schedule
11. loan_scenarios
12. property_scenarios
13. property_milestones
14. property_tax_data
15. transactions
16. invoices
17. companies
18. company_financials
19. portfolios
20. positions
21. position_history
22. savings_plans
23. daily_snapshots
24. recurring_transactions
25. cashflow_forecast

Für jede Tabelle:
- RLS aktivieren
- Policy für authenticated users
- Trigger für updated_at
- Wichtige Indizes

Beachte: Die exakten Spalten sind in SPEC.md definiert.
```

### Prompt 5: Productivity Module Schema

```
Erstelle supabase/migrations/00003_productivity_module.sql basierend auf SPEC.md:

Tabellen:
1. clients
2. inbox_items
3. meetings
4. meeting_action_items
5. time_entries
6. tickets
7. ticket_comments
8. documents
9. document_embeddings (mit vector Typ)

Für document_embeddings:
- Erstelle einen IVFFlat Index für vector similarity search
- Erstelle eine Funktion match_documents(query_embedding, match_threshold, match_count)

Alle RLS Policies und Indizes hinzufügen.
```

### Prompt 6: Health Module Schema

```
Erstelle supabase/migrations/00004_health_module.sql basierend auf SPEC.md:

Tabellen:
1. habits
2. habit_logs
3. daily_nutrition
4. supplements
5. supplement_logs
6. supplement_cycles
7. garmin_daily_stats
8. training_plans
9. training_plan_days
10. exercises
11. workouts
12. workout_sets
13. daily_readiness

Erstelle auch:
- Funktion calculate_readiness_score(date) die den Readiness Score berechnet
- Funktion get_habit_streak(habit_id) für Habit-Streaks

Alle RLS Policies und Indizes.
```

### Prompt 7: Goals & AI Module Schema

```
Erstelle supabase/migrations/00005_goals_module.sql basierend auf SPEC.md:

Tabellen:
1. goals
2. goal_key_results
3. goal_checkins
4. daily_logs
5. weekly_reviews

Erstelle supabase/migrations/00006_ai_copilot_module.sql:

Tabellen:
1. ai_insights
2. telegram_messages
3. telegram_reminders

Erstelle nützliche Views:
- v_active_goals (nur aktive Ziele mit Progress)
- v_weekly_summary (aggregierte Wochendaten)
- v_daily_dashboard (alle Tagesdaten zusammen)
```

---

## 🎨 Phase 2: Frontend Setup

### Prompt 8: React Projekt initialisieren

```
Erstelle das Frontend-Projekt in ./frontend:

1. Initialisiere mit Vite + React + TypeScript:
   npm create vite@latest frontend -- --template react-ts

2. Installiere Dependencies:
   - @supabase/supabase-js
   - @tanstack/react-query
   - zustand (State Management)
   - react-router-dom
   - tailwindcss + postcss + autoprefixer
   - @headlessui/react
   - @heroicons/react
   - recharts (für Charts)
   - date-fns
   - clsx

3. Konfiguriere:
   - Tailwind CSS
   - TypeScript paths (@/ für src/)
   - Supabase Client in src/lib/supabase.ts

4. Erstelle Dockerfile für Production

5. Erstelle basic Layout-Komponenten:
   - src/components/layout/Layout.tsx
   - src/components/layout/Sidebar.tsx
   - src/components/layout/Header.tsx
```

### Prompt 9: Supabase Types generieren

```
Generiere TypeScript-Types aus dem Supabase Schema:

1. Installiere supabase CLI falls nicht vorhanden
2. Führe aus: supabase gen types typescript --local > frontend/src/types/database.ts

Falls die DB noch nicht läuft, erstelle die Types manuell basierend auf SPEC.md für:
- src/types/database.ts (auto-generated style)
- src/types/wealth.ts (Domain Types)
- src/types/productivity.ts
- src/types/health.ts
- src/types/goals.ts

Die Types sollen die Supabase Response-Types wrappen.
```

### Prompt 10: Dashboard Seite

```
Erstelle die Dashboard-Hauptseite basierend auf SPEC.md:

src/pages/Dashboard.tsx mit:
1. TodayOverview Komponente (Garmin Stats, Habits, Schedule)
2. QuickStats Komponente (Nettovermögen, FIRE Progress, Inbox Count)
3. AlertsPanel (ai_insights mit priority)
4. AIInsights Panel (letzte Insights)

Erstelle die benötigten Komponenten in src/components/dashboard/:
- TodayOverview.tsx
- QuickStats.tsx
- AlertsPanel.tsx
- AIInsights.tsx

Nutze @tanstack/react-query für Data Fetching.
Nutze Supabase Realtime für Live-Updates der Stats.
```

### Prompt 11: Wealth Übersicht

```
Erstelle die Wealth-Übersichtsseite:

src/pages/wealth/Overview.tsx mit:
1. NetWorthCard - Großer Vermögensanzeiger mit Trend-Chart
2. Asset Allocation Pie Chart (Immobilien, Investments, Cash, Firma)
3. FIRE Progress Bar
4. Monats-Cashflow Übersicht
5. Quick Links zu Unterbereichen

Komponenten in src/components/wealth/:
- NetWorthCard.tsx
- AssetAllocationChart.tsx
- FireProgress.tsx
- CashflowSummary.tsx

Daten kommen aus:
- daily_snapshots (letzter Eintrag)
- accounts (Summen)
- positions (Investment-Wert)
- loans (Verbindlichkeiten)
```

### Prompt 12: Immobilien-Liste

```
Erstelle die Immobilien-Übersicht:

src/pages/wealth/Properties.tsx:
1. Tabelle aller Immobilien mit:
   - Name, Adresse
   - Einheiten (belegt/gesamt)
   - Leerstandsquote
   - Monatlicher Cashflow
   - Rendite
2. Filter (nach Stadt, Status, Rendite)
3. Sortierung
4. Link zu Detail-Seite

src/pages/wealth/PropertyDetail.tsx:
1. Property Header (Name, Adresse, Kaufdatum)
2. Kontakt zum Verwalter
3. Einheiten-Liste mit Mietern
4. Konten & Darlehen für diese Immobilie
5. Tickets/Aufträge
6. Dokumente
7. Szenarien (10-Jahres-Frist, Verkauf, etc.)

Komponenten:
- PropertyList.tsx
- PropertyCard.tsx
- UnitList.tsx
- TenantCard.tsx
```

---

## 🔄 Phase 3: n8n Workflows

### Prompt 13: BHB Sync Workflow

```
Erstelle den n8n Workflow für Buchhaltungsbutler Sync als JSON in n8n/workflows/wealth/sync-bhb-accounts.json:

Der Workflow soll:
1. Trigger: Cron täglich um 06:00
2. HTTP Request zu BHB API /api/v1/accounts
   - Auth: Basic Auth (API-Client:API-Secret)
   - Header: api_key
3. Für jeden Account:
   - Prüfen ob in Supabase accounts vorhanden (via bhb_account_id)
   - Insert oder Update
4. Sync-Status in sync_status updaten
5. Bei Fehler: Telegram Nachricht senden

Erstelle auch sync-bhb-transactions.json:
1. Trigger: Cron täglich um 06:15
2. Letztes Sync-Datum aus sync_status holen
3. HTTP Request zu BHB API /api/v1/transactions mit Datumsfilter
4. Transaktionen in Supabase upserten
5. Sync-Status updaten
```

### Prompt 14: GetMyInvoices Sync Workflow

```
Erstelle n8n/workflows/wealth/sync-gmi-invoices.json:

1. Trigger: Cron täglich um 06:30
2. HTTP Request zu GMI API https://api.getmyinvoices.com/accounts/v3/documents
   - Header: x-api-key
   - Parameter: created_since (letztes Sync-Datum)
3. Für jedes Dokument:
   - Prüfen ob in Supabase invoices vorhanden (via gmi_document_id)
   - PDF-URL speichern
   - Insert oder Update
4. Optional: PDF herunterladen und in Supabase Storage speichern
5. Sync-Status updaten
6. Bei neuer Rechnung: Telegram Nachricht

Bonus: Erstelle Workflow process-scan-inbox.json der auf neue GMI-Dokumente reagiert und diese als inbox_items anlegt.
```

### Prompt 15: Microsoft To-Do Sync

```
Erstelle n8n/workflows/productivity/sync-microsoft-todo.json:

BIDIREKTIONALER Sync:

1. Trigger: Cron alle 10 Minuten

2. Von Microsoft To-Do → Supabase:
   - Microsoft Graph API: GET /me/todo/lists/{listId}/tasks
   - Für jeden Task: In inbox_items upserten
   - source = 'microsoft_todo', source_id = task.id

3. Von Supabase → Microsoft To-Do:
   - Alle inbox_items wo source = 'microsoft_todo' UND updated_at > last_sync
   - Für jeden: Microsoft Graph API PATCH /me/todo/lists/{listId}/tasks/{taskId}
   - Status-Mapping: inbox_items.status → task.status

4. Neue Tasks von Supabase → To-Do:
   - Alle inbox_items wo source = 'manual' UND sync_to_todo = true
   - POST zu Microsoft Graph
   - source_id updaten

5. Sync-Status updaten

Credentials: OAuth 2.0 mit Microsoft 365
```

### Prompt 16: Telegram Bot Workflow

```
Erstelle n8n/workflows/ai-copilot/process-telegram-message.json:

1. Trigger: Telegram Trigger (Webhook)

2. Message Type Check:
   - Text → parse-command
   - Voice → Whisper Transkription → parse-command

3. Command Parser (Code Node):
   - /task <text> → Insert in inbox_items
   - /habit <name> → Update habit_logs
   - /sup <name> → Insert supplement_logs
   - /today → Generiere Tagesübersicht
   - /balance → Hole Kontostände
   - /networth → Hole daily_snapshots
   - Freetext → An OpenAI senden mit Context

4. OpenAI Integration:
   - System Prompt mit User-Kontext
   - Tools für Supabase-Abfragen
   - RAG für Dokument-Fragen

5. Antwort an Telegram senden

Erstelle auch generate-morning-briefing.json:
1. Trigger: Cron 06:30
2. Hole: garmin_daily_stats, habits für heute, inbox_items, Termine
3. Generiere Briefing-Text mit OpenAI
4. Sende an Telegram
```

### Prompt 17: Garmin Sync Workflow

```
Erstelle n8n/workflows/health/sync-garmin-daily.json:

Da Garmin keine offizielle API hat, nutze den garth Python-Wrapper:

1. Trigger: Cron täglich um 08:00

2. Execute Command Node mit Python:
   ```python
   import garth
   from datetime import date
   
   garth.login(email, password)
   # oder garth.resume() wenn Session gespeichert
   
   stats = garth.DailyStats.get(date.today())
   sleep = garth.SleepData.get(date.today())
   ```

3. Daten parsen und in garmin_daily_stats einfügen:
   - sleep_score, sleep_duration, deep/light/rem_sleep
   - body_battery_start/end
   - stress_avg/max
   - steps, calories
   - resting_hr, hrv

4. Readiness Score berechnen (Supabase Funktion aufrufen)

5. Bei schlechtem Sleep Score: Telegram Alert

Alternative: Nutze Zapier/Make als Zwischenschicht zu Garmin Connect.
```

---

## 🤖 Phase 4: AI Copilot

### Prompt 18: RAG für Dokumente

```
Erweitere den bestehenden RAG-Workflow oder erstelle n8n/workflows/ai-copilot/index-document.json:

1. Trigger: Webhook (wenn neues Dokument in documents)

2. Dokument laden:
   - PDF aus Supabase Storage
   - Text extrahieren (pdf-parse oder Apache Tika)

3. Chunking:
   - Text in 500-Token Chunks teilen
   - 50 Token Overlap

4. Embeddings erstellen:
   - OpenAI Embeddings API
   - Model: text-embedding-3-small

5. In Supabase speichern:
   - document_embeddings Tabelle
   - chunk_index, content, embedding, metadata

6. documents.is_indexed = true setzen

Für Abfragen (im Telegram Bot):
1. Query → Embedding
2. Supabase match_documents Funktion
3. Top 5 Chunks als Context
4. OpenAI mit Context + Query
```

### Prompt 19: AI Insights Generator

```
Erstelle n8n/workflows/ai-copilot/generate-insights.json:

1. Trigger: Cron täglich um 22:00

2. Daten sammeln:
   - loans wo interest_fixed_until < NOW() + 6 months
   - properties wo (NOW() - purchase_date) > 9.5 years (10-Jahres-Frist)
   - accounts wo current_balance < threshold
   - habits mit niedriger completion rate
   - garmin_daily_stats Trends (Schlaf, Stress)
   - positions mit großen Kursänderungen
   - invoices die bald fällig sind
   - Mieter deren Verträge auslaufen

3. Für jedes Finding:
   - AI Insight generieren mit OpenAI
   - Priorität bestimmen (info, warning, action_required)
   - In ai_insights speichern

4. High Priority Insights → Telegram senden

5. Alte Insights (> 30 Tage, is_read = true) löschen
```

### Prompt 20: Weekly Review Automation

```
Erstelle n8n/workflows/ai-copilot/generate-weekly-review.json:

1. Trigger: Cron Sonntag 18:00

2. Wochendaten aggregieren:
   - Tasks completed/created/overdue
   - Meetings & billable hours
   - Habit completion rate
   - Garmin Durchschnitte
   - Goal Progress
   - Finanz-Änderungen

3. Weekly Review Record erstellen in weekly_reviews

4. Telegram Nachricht mit Zusammenfassung senden

5. Fragen stellen (interaktiv):
   - "Was waren deine 3 größten Wins?"
   - "Was hast du gelernt?"
   - "Was ist dein Fokus nächste Woche?"

6. Antworten in weekly_reviews updaten

7. Wochenziele für nächste Woche vorschlagen basierend auf:
   - Monatsziel-Progress
   - Überfällige Tasks
   - Patterns aus vorherigen Wochen
```

---

## 🧪 Testing & Debugging

### Prompt 21: Test-Daten erstellen

```
Erstelle supabase/seed/test_data.sql mit realistischen Testdaten:

1. 5 Immobilien (properties) mit verschiedenen Typen
2. 15 Wohneinheiten (units) verteilt auf die Immobilien
3. 10 Mieter (tenants) mit verschiedenen Status
4. 3 Banken mit je 3-5 Konten
5. 5 Darlehen mit unterschiedlichen Laufzeiten/Zinsen
6. 2 Portfolios mit je 5 ETF-Positionen
7. 10 Habits
8. 5 Supplements
9. 30 Tage garmin_daily_stats
10. Jahresziel mit Quartals- und Monatszielen

Die Daten sollen konsistent sein (Foreign Keys stimmen, Summen ergeben Sinn).
```

### Prompt 22: API Tests

```
Erstelle tests/ Ordner mit API-Tests:

1. tests/supabase.test.ts:
   - Verbindung testen
   - CRUD für jede Tabelle
   - RLS Policies testen

2. tests/n8n-workflows.test.ts:
   - Webhook Endpoints testen
   - Cron-Jobs manuell triggern
   - Error Handling prüfen

3. tests/telegram-bot.test.ts:
   - Alle Commands testen
   - Voice Message Handling
   - Error Responses

Nutze Vitest oder Jest.
```

---

## 🚀 Deployment

### Prompt 23: Hetzner Deployment

```
Erstelle die Deployment-Dokumentation und Scripts:

1. docs/deployment.md:
   - Hetzner Cloud Server Setup (CX21 oder höher)
   - Docker & Docker Compose installieren
   - Domain & DNS konfigurieren
   - SSL Zertifikate (automatisch via Caddy)
   - Firewall Regeln

2. scripts/deploy.sh:
   - SSH zu Hetzner
   - Git Pull
   - Docker Images bauen
   - Docker Compose up
   - Health Check

3. scripts/backup.sh:
   - Supabase DB Dump
   - Storage Backup
   - Zu Hetzner Storage Box kopieren

4. .github/workflows/deploy.yml (optional):
   - CI/CD Pipeline
   - Build, Test, Deploy

5. docker-compose.prod.yml:
   - Production Overrides
   - Resource Limits
   - Logging
```

---

## 💡 Hilfreiche Tipps

### Bei Fehlern

```
Ich habe folgenden Fehler: [Fehler einfügen]

Kontext:
- Welche Datei/Workflow betroffen
- Was ich versucht habe
- Relevante Logs

Bitte analysiere das Problem und schlage eine Lösung vor.
```

### Für Erweiterungen

```
Ich möchte folgendes Feature hinzufügen: [Feature beschreiben]

Basierend auf der bestehenden SPEC.md und Architektur:
1. Welche Tabellen müssen angepasst/erstellt werden?
2. Welche n8n Workflows sind nötig?
3. Welche Frontend-Komponenten?

Erstelle einen Plan und dann die Implementierung.
```

### Für Code Reviews

```
Überprüfe den folgenden Code auf:
1. Best Practices
2. Sicherheitslücken
3. Performance-Probleme
4. TypeScript Type Safety
5. Error Handling

[Code einfügen oder Datei angeben]
```

---

## Reihenfolge für die Entwicklung

1. **Woche 1-2**: Prompts 1-7 (Setup & Schema)
2. **Woche 3-4**: Prompts 8-12 (Frontend Basis)
3. **Woche 5-6**: Prompts 13-17 (n8n Workflows)
4. **Woche 7-8**: Prompts 18-20 (AI Features)
5. **Woche 9**: Prompts 21-22 (Testing)
6. **Woche 10**: Prompt 23 (Deployment)

Viel Erfolg mit Life OS! 🚀
