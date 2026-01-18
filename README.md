# 🧠 Life OS

> Personal Operating System für finanzielle Freiheit, Produktivität und Gesundheit

Ein selbst gehostetes "Second Brain" mit AI-Unterstützung.

---

## ✨ Features

### 💰 Wealth Management
- Immobilien-Portfolio Tracking (45+ Einheiten)
- 50+ Bankkonten verwalten
- Darlehen mit Annuität & Zinsbindung
- Investment-Tracking (ETFs via Trade Republic)
- Planspiele & Szenarien (steuerfreier Verkauf nach 10 Jahren)
- Buchhaltungsbutler & GetMyInvoices Integration
- FIRE-Fortschritt & Prognose

### ⚡ Productivity
- Unified Inbox (To-Do, Emails, Meetings, Scans)
- Microsoft To-Do Sync (bidirektional)
- Plaud Meeting Minutes Integration
- Time Tracking für Kundenabrechnung
- Handwerker-Tickets & Aufträge

### 💪 Health
- Habit Tracking
- Nutrition & Makros
- Supplements & Peptide Protokolle
- Garmin Integration (Schlaf, Stress, Bodybatterie, HRV)
- Training & Workout Tracking
- Readiness Score

### 🎯 Goals
- Hierarchische Ziele (Jahr → Quartal → Monat → Woche → Tag)
- OKRs & Key Results
- Weekly Reviews
- FIRE-Ziel Tracking

### 🤖 AI Copilot
- Morning Briefing via Telegram
- Proaktive Insights & Warnungen
- RAG für Dokument-Abfragen (Mietverträge etc.)
- Energie-basierte Tagesplanung
- Voice Commands via Telegram

---

## 🛠️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Datenbank | Supabase (PostgreSQL + Vector Store) |
| Automatisierung | n8n |
| Frontend | React + Tailwind CSS |
| Reverse Proxy | Caddy |
| Container | Docker Compose |
| AI/LLM | OpenAI GPT-4o |
| Bot | Telegram |

---

## 🚀 Quick Start

### Voraussetzungen

- Docker & Docker Compose
- Git
- (Optional) Node.js 18+ für lokale Frontend-Entwicklung

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/yourusername/life-os.git
cd life-os

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und alle Werte ausfüllen

# 3. Stack starten
docker compose up -d

# 4. Auf Services zugreifen
# Dashboard: https://dashboard.localhost
# n8n:       https://n8n.localhost
# Supabase:  https://studio.localhost
```

### Erste Schritte

1. **Supabase Studio öffnen** (https://studio.localhost)
2. **Migrations ausführen** (SQL Editor → migrations/*.sql)
3. **n8n öffnen** (https://n8n.localhost)
4. **Workflows importieren** (n8n/workflows/*.json)
5. **Credentials einrichten** (Buchhaltungsbutler, GMI, Telegram, etc.)

---

## 📁 Projektstruktur

```
life-os/
├── SPEC.md                 # Komplette Spezifikation
├── CLAUDE_CODE_PROMPTS.md  # Prompts für Entwicklung
├── docker-compose.yml      # Docker Stack
├── caddy/                  # Reverse Proxy Config
├── supabase/
│   ├── migrations/         # SQL Schema
│   └── kong.yml           # API Gateway
├── n8n/workflows/          # Automatisierungen
├── frontend/               # React Dashboard
└── scripts/                # Setup & Deployment
```

---

## 📖 Dokumentation

- [SPEC.md](./SPEC.md) - Vollständige technische Spezifikation
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detaillierte Ordnerstruktur
- [CLAUDE_CODE_PROMPTS.md](./CLAUDE_CODE_PROMPTS.md) - Entwicklungs-Prompts

---

## 🔗 Integrationen

| Service | Zweck |
|---------|-------|
| Buchhaltungsbutler | Konten & Buchungen |
| GetMyInvoices | Rechnungen & Belege |
| Microsoft 365 | To-Do, Outlook, Calendar |
| Plaud | Meeting Minutes |
| Garmin Connect | Health Daten |
| Telegram | Bot Interface |
| OpenAI | AI Features |

---

## 🤝 Entwicklung

Dieses Projekt wurde mit [Claude Code](https://www.anthropic.com/claude-code) entwickelt.

Für Weiterentwicklung:
1. SPEC.md lesen
2. CLAUDE_CODE_PROMPTS.md für ready-to-use Prompts nutzen
3. Iterativ mit Claude Code entwickeln

---

## 📄 Lizenz

Private Nutzung. Nicht zur Weiterverteilung bestimmt.

---

## 🙏 Credits

- [Supabase](https://supabase.com) - Backend as a Service
- [n8n](https://n8n.io) - Workflow Automation
- [Caddy](https://caddyserver.com) - Web Server
- [Anthropic Claude](https://anthropic.com) - AI Assistant
