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
