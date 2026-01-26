# Claude Code - Project Guidelines

## Frontend Build Process

**WICHTIG**: Das Frontend benötigt Umgebungsvariablen zur Build-Zeit (Vite baked sie ein).

### Frontend bauen
```bash
# IMMER dieses Script verwenden:
bash scripts/build-frontend.sh

# NICHT direkt docker build verwenden - die Umgebungsvariablen fehlen dann!
```

### Nach dem Build
```bash
docker compose up -d frontend
```

### Erforderliche Umgebungsvariablen in .env
- `SUPABASE_URL` - API URL (z.B. https://api.life-os.fwanner.de)
- `SUPABASE_ANON_KEY` - Supabase Anonymous Key

## Supabase Queries

### .single() vs .maybeSingle()
- **IMMER `.maybeSingle()` verwenden** wenn ein Datensatz möglicherweise nicht existiert
- `.single()` wirft HTTP 406 Fehler wenn kein Datensatz gefunden wird
- `.maybeSingle()` gibt `null` zurück wenn kein Datensatz existiert

```typescript
// FALSCH - wirft 406 wenn keine Daten existieren
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single()

// RICHTIG - gibt null zurück wenn keine Daten existieren
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .maybeSingle()
```

## Projekt-Struktur

```
/root/Felix-AI/
├── frontend/           # React Frontend (Vite)
├── caddy/             # Caddy Reverse Proxy Konfiguration
├── scripts/           # Build und Setup Scripts
├── supabase/          # Supabase Migrations und Seeds
├── docker-compose.yml # Docker Services
└── .env               # Umgebungsvariablen (nicht committen!)
```

## Domains (Produktion)
- Dashboard: https://dashboard.life-os.fwanner.de
- API: https://api.life-os.fwanner.de
- N8N: https://n8n.life-os.fwanner.de
- Studio: https://studio.life-os.fwanner.de

## n8n Konfiguration

### Authentifizierung
- n8n 2.x verwendet internes User Management (nicht mehr Basic Auth)
- Login: `fw@redcastle-eg.de`
- Jeder Benutzer braucht ein "Personal Project"

### Credentials und Workflows
- Credentials und Workflows müssen einem Projekt zugewiesen sein
- Prüfen mit:
```sql
-- In n8n Datenbank
SELECT c.name, sc."projectId" FROM credentials_entity c
LEFT JOIN shared_credentials sc ON c.id = sc."credentialsId";
```

### Reverse Proxy
- `N8N_PROXY_HOPS=1` muss gesetzt sein (nicht N8N_TRUST_PROXY)
- Verhindert X-Forwarded-For Fehler

## Datenbank

### Neue Tabellen erstellen
Bei neuen Frontend-Features immer prüfen:
1. Tabelle existiert in PostgreSQL
2. RLS ist aktiviert
3. RLS Policies sind erstellt

```sql
-- Template für neue Tabellen
CREATE TABLE IF NOT EXISTS new_table (...);
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON new_table FOR SELECT USING (...);
```

## Caddy

### Basic Auth
- Verwende `basic_auth` (nicht `basicauth` - deprecated)
