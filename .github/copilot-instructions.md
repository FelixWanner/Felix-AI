# AI Coding Agent Instructions for Life OS

## Project Overview
Life OS is a self-hosted personal operating system integrating wealth management, productivity tracking, health monitoring, and goal setting with AI assistance. It uses Supabase (PostgreSQL + vector extensions) as the backend, n8n for workflow automation, React with Tailwind CSS for the frontend, and Caddy for HTTPS reverse proxy.

## Architecture
- **Frontend**: React app in `frontend/` with TanStack Query for data fetching and Zustand for state management
- **Backend**: Supabase with RLS policies; migrations in `supabase/migrations/`
- **Automation**: n8n workflows in `n8n/workflows/` handle external API integrations (e.g., Buchhaltungsbutler, Garmin)
- **AI Copilot**: Telegram bot triggers n8n workflows that query Supabase and OpenAI for insights
- **Data Flow**: External APIs → n8n → Supabase; Frontend → Supabase; Telegram → n8n → Supabase/OpenAI

## Key Patterns
- **Supabase Schema**: Use migrations for schema changes; enable RLS on all tables; add updated_at triggers
- **n8n Workflows**: JSON files in `n8n/workflows/`; use queue mode with Redis; workers scale via `N8N_WORKER_COUNT`
- **React Components**: Functional components with hooks; use `@tanstack/react-query` for Supabase queries; Tailwind for styling
- **Environment**: All services in Docker Compose with profiles; no exposed ports—route through Caddy
- **Integrations**: Bidirectional syncs (e.g., Microsoft To-Do); cron triggers for daily updates; Telegram for voice/text commands

## Development Workflow
- **Setup**: `docker compose up -d` starts all services; access via HTTPS hostnames (e.g., `n8n.localhost`)
- **Schema Changes**: Add SQL in `supabase/migrations/`; run via Supabase Studio or CLI
- **Workflow Testing**: Import JSON workflows in n8n UI; test executions manually
- **Frontend Dev**: `cd frontend && npm run dev` for hot reload; build with `npm run build`
- **Debugging**: `docker compose logs <service>`; n8n workflow debugger; Supabase logs in dashboard

## Conventions
- **Naming**: Snake_case for DB columns/functions; camelCase for JS/TS; kebab-case for files
- **Error Handling**: Use try/catch in async functions; log errors with context
- **Security**: Never expose ports; use Supabase RLS; bcrypt for Caddy auth
- **Dependencies**: Pin versions in `package.json`; add to `n8n/Dockerfile.runner` for code nodes
- **Commits**: Feature branches; squash merges; update CHANGELOG.md semantically

## Examples
- Add new table: Create `supabase/migrations/0000X_new_feature.sql` with CREATE TABLE, RLS, indexes
- New workflow: JSON in `n8n/workflows/` with HTTP Request nodes for APIs, Supabase nodes for DB ops
- React component: Use `useQuery` from `@tanstack/react-query` for data; e.g., `const { data } = useQuery({ queryKey: ['properties'], queryFn: fetchProperties })`
- Telegram command: Add to n8n workflow with OpenAI node for natural language processing

## Key Files
- [SPEC.md](SPEC.md): Complete requirements and schema
- [docker-compose.yml](docker-compose.yml): Service definitions
- [frontend/package.json](frontend/package.json): Frontend dependencies
- [supabase/migrations/](supabase/migrations/): DB schema evolution
- [n8n/workflows/](n8n/workflows/): Automation logic