#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Life OS - Initialize Database Roles
# Runs as first init script before SQL migrations
# ═══════════════════════════════════════════════════════════════

set -e

# Use postgres superuser
export PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

echo "Initializing database roles and n8n database..."

# ───────────────────────────────────────────────────────────────
# Create Supabase roles
# ───────────────────────────────────────────────────────────────
psql -v ON_ERROR_STOP=1 <<-EOSQL
    -- Create roles if they don't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN NOINHERIT;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN NOINHERIT;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
            CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
            CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
            CREATE ROLE supabase_admin NOINHERIT BYPASSRLS LOGIN PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
            CREATE ROLE supabase_auth_admin NOINHERIT LOGIN PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
            CREATE ROLE supabase_storage_admin NOINHERIT LOGIN PASSWORD '${POSTGRES_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Grant role memberships
    GRANT anon TO authenticator;
    GRANT authenticated TO authenticator;
    GRANT service_role TO authenticator;
    GRANT supabase_admin TO postgres;

    -- Auth schema
    CREATE SCHEMA IF NOT EXISTS auth;
    GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;
    GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

    -- Storage schema
    CREATE SCHEMA IF NOT EXISTS storage;
    GRANT USAGE ON SCHEMA storage TO supabase_storage_admin, service_role;
    GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

    -- Realtime schema
    CREATE SCHEMA IF NOT EXISTS _realtime;
    GRANT USAGE ON SCHEMA _realtime TO supabase_admin;
    GRANT ALL ON SCHEMA _realtime TO supabase_admin;

    -- Public schema permissions
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
EOSQL

# ───────────────────────────────────────────────────────────────
# Create n8n database and user
# ───────────────────────────────────────────────────────────────
echo "Creating n8n database and user..."

# Get n8n password from environment or use a default
N8N_DB_PWD="${N8N_DB_PASSWORD:-n8n_default_password}"

psql -v ON_ERROR_STOP=1 <<-EOSQL
    -- Create n8n user
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'n8n') THEN
            CREATE ROLE n8n WITH LOGIN PASSWORD '${N8N_DB_PWD}';
        END IF;
    END
    \$\$;
EOSQL

# Create n8n database (outside the EOSQL block to check if exists)
if ! psql -lqt | cut -d \| -f 1 | grep -qw n8n; then
    createdb -O n8n n8n
    echo "Created n8n database"
else
    echo "n8n database already exists"
fi

psql -v ON_ERROR_STOP=1 <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;
EOSQL

echo "Database initialization complete!"
