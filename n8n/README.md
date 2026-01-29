# n8n Workflows - Felix-AI

Dieses Verzeichnis enthält alle n8n Workflow-Definitionen für das Felix-AI System.

## Automatischer Import

Die Workflows werden **automatisch beim Start** von Docker Compose importiert:

```bash
docker compose up -d
```

Der `n8n-init` Container wartet auf n8n und importiert alle Workflows aus dem `workflows/` Verzeichnis.

## Manueller Import

Falls du Workflows manuell importieren möchtest:

```bash
# Mit dem Import-Script
./scripts/import-n8n-workflows.sh --wait

# Mit API Key (wenn n8n authentifizierung aktiviert)
./scripts/import-n8n-workflows.sh --api-key <YOUR_API_KEY>

# Dry-Run (zeigt was importiert würde)
./scripts/import-n8n-workflows.sh --dry-run
```

## Workflow-Übersicht

### WEALTH Modul (8 Workflows)

| Nr. | Workflow | Trigger | Beschreibung |
|-----|----------|---------|--------------|
| 01 | sync-bhb-accounts | Cron 06:00 | Synchronisiert Bankkonten von BankingHub |
| 02 | sync-bhb-transactions | Cron 06:30 | Synchronisiert Transaktionen von BankingHub |
| 03 | sync-gmi-invoices | Cron 08:00 | Synchronisiert Rechnungen von GMI |
| 04 | sync-trade-republic | Cron 18:00 | Synchronisiert Trade Republic Portfolio |
| 05 | fetch-etf-prices | Cron 20:00 | Aktualisiert ETF-Preise |
| 06 | create-daily-snapshot | Cron 23:00 | Erstellt täglichen Vermögens-Snapshot |
| 07 | check-rent-payments | Cron 02:00 (monatl.) | Prüft fehlende Mietzahlungen |
| 08 | check-loan-milestones | Cron 03:00 (monatl.) | Prüft Kredit-Meilensteine |

### PRODUCTIVITY Modul (4 Workflows)

| Nr. | Workflow | Trigger | Beschreibung |
|-----|----------|---------|--------------|
| 09 | sync-microsoft-todo | Cron alle 15min | Synchronisiert Microsoft To Do |
| 10 | process-plaud-meeting | Webhook | Verarbeitet Plaud Meeting-Aufnahmen |
| 11 | check-outlook-inbox | Cron alle 10min | Prüft Outlook auf wichtige E-Mails |
| 12 | process-scan-inbox | Webhook | Verarbeitet gescannte Dokumente |

### HEALTH Modul (4 Workflows)

| Nr. | Workflow | Trigger | Beschreibung |
|-----|----------|---------|--------------|
| 13 | sync-garmin-daily | Cron 05:00 | Synchronisiert Garmin Gesundheitsdaten |
| 14 | send-supplement-reminder | Cron 07:00 | Sendet Supplement-Erinnerungen |
| 15 | send-training-reminder | Cron 06:45 | Sendet Training-Erinnerungen |
| 16 | calculate-readiness | Cron 05:30 | Berechnet täglichen Readiness Score |

### AI COPILOT Modul (4 Workflows)

| Nr. | Workflow | Trigger | Beschreibung |
|-----|----------|---------|--------------|
| 17 | generate-morning-briefing | Cron 06:30 | Generiert morgendliches Briefing |
| 18 | generate-weekly-review | Cron So 20:00 | Generiert wöchentliche Zusammenfassung |
| 19 | generate-insights | Cron 22:00 | Analysiert Daten und generiert Insights |
| 20 | process-telegram-message | Webhook | Verarbeitet Telegram Bot Nachrichten |

### DOCUMENTS Modul (1 Workflow)

| Nr. | Workflow | Trigger | Beschreibung |
|-----|----------|---------|--------------|
| 21 | index-document | Webhook | Indexiert Dokumente mit Vector Embeddings |

## Credentials konfigurieren

Nach dem Import müssen folgende Credentials in n8n konfiguriert werden:

### 1. Supabase API
```
Name: Supabase
Type: Supabase API
Host: ${SUPABASE_URL}
Service Role Key: ${SUPABASE_SERVICE_KEY}
```

### 2. Telegram Bot
```
Name: Telegram Bot
Type: Telegram API
Access Token: ${TELEGRAM_BOT_TOKEN}
```

### 3. OpenAI API
```
Name: OpenAI API Key
Type: HTTP Header Auth
Header Name: Authorization
Header Value: Bearer ${OPENAI_API_KEY}
```

### 4. Microsoft OAuth (Outlook/Todo)
```
Name: Microsoft OAuth2
Type: Microsoft OAuth2 API
Client ID: ${AZURE_CLIENT_ID}
Client Secret: ${AZURE_CLIENT_SECRET}
```

### 5. Garmin (optional)
```
Name: Garmin Connect
Type: OAuth2 API
(Konfiguration je nach Garmin API Setup)
```

## Verzeichnisstruktur

```
n8n/
├── README.md           # Diese Datei
├── init/               # Auto-Import Container
│   ├── Dockerfile
│   └── entrypoint.sh
└── workflows/          # Workflow JSON Dateien
    ├── 01-sync-bhb-accounts.json
    ├── 02-sync-bhb-transactions.json
    ├── ...
    └── 21-index-document.json
```

## Workflow bearbeiten

1. Workflow in n8n UI bearbeiten
2. Exportieren als JSON
3. Datei in `workflows/` ersetzen
4. Committen für Versionskontrolle

## Troubleshooting

### Import fehlgeschlagen
```bash
# Container Logs prüfen
docker logs lifeos-n8n-init

# n8n Health prüfen
curl http://localhost:5678/healthz
```

### Workflows nicht sichtbar
```bash
# Manuell neu importieren
docker compose restart n8n-init
```

### Credentials fehlen
Die Workflows werden ohne Credentials importiert. Diese müssen in der n8n UI konfiguriert werden.
