#!/bin/bash
# Build Frontend Docker Image
# This script loads environment variables from .env and passes them as build args

set -e

cd "$(dirname "$0")/.."

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -E '^SUPABASE_URL=|^SUPABASE_ANON_KEY=|^VITE_N8N_WEBHOOK_URL=' | xargs)
fi

# Fallback to SUPABASE_PUBLIC_URL if SUPABASE_URL is not set
if [ -z "$SUPABASE_URL" ]; then
    export SUPABASE_URL=$(grep -E '^SUPABASE_PUBLIC_URL=' .env | cut -d'=' -f2-)
fi

# Check required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env"
    exit 1
fi

echo "Building frontend with:"
echo "  VITE_SUPABASE_URL=$SUPABASE_URL"
echo "  VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:0:20}..."

# Build the Docker image
docker build \
    --build-arg VITE_SUPABASE_URL="$SUPABASE_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --build-arg VITE_N8N_WEBHOOK_URL="$VITE_N8N_WEBHOOK_URL" \
    --no-cache \
    -t lifeos-frontend:latest \
    frontend/

echo "Frontend build complete!"
echo "Run 'docker compose up -d frontend' to deploy"
