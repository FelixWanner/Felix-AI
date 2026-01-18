# Projektstruktur

```
life-os/
│
├── 📄 SPEC.md                      # Komplette Spezifikation
├── 📄 README.md                    # Projekt-Dokumentation
├── 📄 CLAUDE_CODE_PROMPTS.md       # Prompts für Claude Code
├── 📄 .env.example                 # Beispiel-Umgebungsvariablen
├── 📄 .env                         # Lokale Umgebungsvariablen (nicht committen!)
├── 📄 .gitignore
│
├── 🐳 docker-compose.yml           # Docker Stack Definition
├── 🐳 docker-compose.override.yml  # Lokale Overrides
│
├── 📁 caddy/
│   └── Caddyfile                   # Reverse Proxy Konfiguration
│
├── 📁 supabase/
│   ├── 📁 migrations/              # SQL Migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_wealth_module.sql
│   │   ├── 00003_productivity_module.sql
│   │   ├── 00004_health_module.sql
│   │   ├── 00005_goals_module.sql
│   │   ├── 00006_ai_copilot_module.sql
│   │   └── 00007_indexes_and_functions.sql
│   │
│   ├── 📁 seed/                    # Seed-Daten
│   │   ├── 01_banks.sql
│   │   ├── 02_exercises.sql
│   │   └── 03_habits_templates.sql
│   │
│   └── 📁 functions/               # Edge Functions (optional)
│       └── ...
│
├── 📁 n8n/
│   ├── 📁 workflows/               # Exportierte Workflows (JSON)
│   │   ├── wealth/
│   │   │   ├── sync-bhb-accounts.json
│   │   │   ├── sync-bhb-transactions.json
│   │   │   ├── sync-gmi-invoices.json
│   │   │   ├── sync-trade-republic.json
│   │   │   ├── fetch-etf-prices.json
│   │   │   ├── create-daily-snapshot.json
│   │   │   └── check-rent-payments.json
│   │   │
│   │   ├── productivity/
│   │   │   ├── sync-microsoft-todo.json
│   │   │   ├── process-plaud-meeting.json
│   │   │   ├── check-outlook-inbox.json
│   │   │   └── process-scan-inbox.json
│   │   │
│   │   ├── health/
│   │   │   ├── sync-garmin-daily.json
│   │   │   ├── send-supplement-reminder.json
│   │   │   ├── send-training-reminder.json
│   │   │   └── calculate-readiness.json
│   │   │
│   │   └── ai-copilot/
│   │       ├── generate-morning-briefing.json
│   │       ├── generate-weekly-review.json
│   │       ├── generate-insights.json
│   │       └── process-telegram-message.json
│   │
│   └── 📁 credentials/             # Credential Templates (ohne Secrets!)
│       └── credentials-template.json
│
├── 📁 frontend/
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tailwind.config.js
│   ├── 📄 tsconfig.json
│   ├── 📄 Dockerfile
│   │
│   ├── 📁 public/
│   │   └── favicon.ico
│   │
│   └── 📁 src/
│       ├── 📄 main.tsx
│       ├── 📄 App.tsx
│       ├── 📄 index.css
│       │
│       ├── 📁 components/
│       │   ├── 📁 ui/              # Shadcn/UI Components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── input.tsx
│       │   │   └── ...
│       │   │
│       │   ├── 📁 layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── 📁 wealth/
│       │   │   ├── NetWorthCard.tsx
│       │   │   ├── PropertyList.tsx
│       │   │   ├── PropertyDetail.tsx
│       │   │   ├── AccountList.tsx
│       │   │   ├── LoanOverview.tsx
│       │   │   ├── CashflowChart.tsx
│       │   │   └── InvestmentPortfolio.tsx
│       │   │
│       │   ├── 📁 productivity/
│       │   │   ├── InboxList.tsx
│       │   │   ├── TaskCard.tsx
│       │   │   ├── MeetingList.tsx
│       │   │   ├── TimeTracker.tsx
│       │   │   └── TicketBoard.tsx
│       │   │
│       │   ├── 📁 health/
│       │   │   ├── HabitTracker.tsx
│       │   │   ├── HabitHeatmap.tsx
│       │   │   ├── SupplementLog.tsx
│       │   │   ├── GarminStats.tsx
│       │   │   ├── ReadinessScore.tsx
│       │   │   └── WorkoutLog.tsx
│       │   │
│       │   ├── 📁 goals/
│       │   │   ├── GoalTree.tsx
│       │   │   ├── GoalProgress.tsx
│       │   │   └── WeeklyReview.tsx
│       │   │
│       │   └── 📁 dashboard/
│       │       ├── TodayOverview.tsx
│       │       ├── QuickStats.tsx
│       │       ├── AlertsPanel.tsx
│       │       └── AIInsights.tsx
│       │
│       ├── 📁 pages/
│       │   ├── Dashboard.tsx
│       │   ├── 📁 wealth/
│       │   │   ├── Overview.tsx
│       │   │   ├── Properties.tsx
│       │   │   ├── PropertyDetail.tsx
│       │   │   ├── Accounts.tsx
│       │   │   ├── Loans.tsx
│       │   │   ├── Investments.tsx
│       │   │   └── Scenarios.tsx
│       │   │
│       │   ├── 📁 productivity/
│       │   │   ├── Inbox.tsx
│       │   │   ├── Tasks.tsx
│       │   │   ├── Meetings.tsx
│       │   │   ├── TimeTracking.tsx
│       │   │   └── Tickets.tsx
│       │   │
│       │   ├── 📁 health/
│       │   │   ├── Habits.tsx
│       │   │   ├── Nutrition.tsx
│       │   │   ├── Supplements.tsx
│       │   │   ├── Training.tsx
│       │   │   └── Garmin.tsx
│       │   │
│       │   ├── 📁 goals/
│       │   │   ├── Overview.tsx
│       │   │   ├── YearlyGoals.tsx
│       │   │   └── Reviews.tsx
│       │   │
│       │   ├── 📁 documents/
│       │   │   ├── List.tsx
│       │   │   ├── Upload.tsx
│       │   │   └── Search.tsx
│       │   │
│       │   └── 📁 settings/
│       │       ├── Profile.tsx
│       │       ├── Integrations.tsx
│       │       └── Notifications.tsx
│       │
│       ├── 📁 hooks/
│       │   ├── useSupabase.ts
│       │   ├── useAuth.ts
│       │   ├── useRealtime.ts
│       │   └── useQuery.ts
│       │
│       ├── 📁 lib/
│       │   ├── supabase.ts
│       │   ├── utils.ts
│       │   └── constants.ts
│       │
│       ├── 📁 types/
│       │   ├── database.ts         # Auto-generated from Supabase
│       │   ├── wealth.ts
│       │   ├── productivity.ts
│       │   ├── health.ts
│       │   └── goals.ts
│       │
│       └── 📁 stores/              # Zustand Stores
│           ├── authStore.ts
│           ├── uiStore.ts
│           └── filterStore.ts
│
├── 📁 telegram-bot/                # Optional: Separater Bot (falls nicht in n8n)
│   ├── 📄 package.json
│   ├── 📄 Dockerfile
│   └── 📁 src/
│       ├── index.ts
│       ├── commands.ts
│       └── handlers.ts
│
├── 📁 scripts/
│   ├── setup.sh                    # Initiales Setup
│   ├── backup.sh                   # Datenbank-Backup
│   ├── restore.sh                  # Datenbank-Restore
│   └── deploy.sh                   # Deployment zu Hetzner
│
└── 📁 docs/
    ├── api-integration.md          # API-Dokumentation
    ├── deployment.md               # Deployment-Anleitung
    └── troubleshooting.md          # Fehlerbehebung
```

---

## Modul-Übersicht

### Phase 1: Foundation
- `docker-compose.yml`
- `caddy/Caddyfile`
- `supabase/migrations/00001_initial_schema.sql`

### Phase 2: Wealth Core
- `supabase/migrations/00002_wealth_module.sql`
- `n8n/workflows/wealth/*.json`
- `frontend/src/pages/wealth/*.tsx`
- `frontend/src/components/wealth/*.tsx`

### Phase 3: Wealth Advanced
- Erweiterung der Wealth-Migrations
- Szenario-Komponenten
- Steuer-Tracking

### Phase 4: Productivity
- `supabase/migrations/00003_productivity_module.sql`
- `n8n/workflows/productivity/*.json`
- `frontend/src/pages/productivity/*.tsx`

### Phase 5: Health
- `supabase/migrations/00004_health_module.sql`
- `n8n/workflows/health/*.json`
- `frontend/src/pages/health/*.tsx`

### Phase 6-7: Training & Goals
- `supabase/migrations/00005_goals_module.sql`
- Training-Tracking-Komponenten
- Goal-Hierarchie-UI

### Phase 8: AI Copilot
- `supabase/migrations/00006_ai_copilot_module.sql`
- `n8n/workflows/ai-copilot/*.json`
- Telegram Bot Integration

### Phase 9: Polish
- Reports & Exports
- Mobile Optimierung
- Performance Tuning
