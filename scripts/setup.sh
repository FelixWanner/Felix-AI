#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Life OS - Setup Script
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}→ $1${NC}"
}

# Generate JWT for Supabase (anon or service_role)
generate_jwt() {
    local role=$1
    local jwt_secret=$2

    # Header: {"alg":"HS256","typ":"JWT"}
    local header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    # Payload with role and long expiry (2033)
    local payload=$(echo -n "{\"iss\":\"supabase\",\"role\":\"$role\",\"iat\":$(date +%s),\"exp\":1999999999}" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    # Signature
    local signature=$(echo -n "${header}.${payload}" | openssl dgst -sha256 -hmac "$jwt_secret" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')

    echo "${header}.${payload}.${signature}"
}

# ───────────────────────────────────────────────────────────────
# Check Prerequisites
# ───────────────────────────────────────────────────────────────
print_header "Checking Prerequisites"

# Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "  → https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker is installed: $(docker --version)"

# Docker Compose
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed or not available."
    echo "  → Docker Desktop includes Compose, or install docker-compose-plugin"
    exit 1
fi
print_success "Docker Compose is available: $(docker compose version --short)"

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker daemon is running"

# Check for openssl
if ! command -v openssl &> /dev/null; then
    print_error "OpenSSL is not installed. Required for generating secrets."
    exit 1
fi
print_success "OpenSSL is available"

# ───────────────────────────────────────────────────────────────
# Setup Environment
# ───────────────────────────────────────────────────────────────
print_header "Setting up Environment"

if [ -f .env ]; then
    print_warning ".env already exists"
    read -p "Do you want to regenerate secrets? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env file"
    else
        REGENERATE=true
    fi
else
    cp .env.example .env
    print_success "Created .env from .env.example"
    REGENERATE=true
fi

if [ "$REGENERATE" = true ]; then
    echo ""
    print_info "Generating secure secrets..."

    # Generate PostgreSQL password (alphanumeric, 32 chars)
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    print_success "Generated POSTGRES_PASSWORD"

    # Generate JWT Secret (base64, 32+ chars)
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    print_success "Generated JWT_SECRET"

    # Generate Supabase API Keys using the JWT secret
    ANON_KEY=$(generate_jwt "anon" "$JWT_SECRET")
    SERVICE_KEY=$(generate_jwt "service_role" "$JWT_SECRET")
    sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env
    sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SERVICE_KEY|" .env
    print_success "Generated SUPABASE_ANON_KEY"
    print_success "Generated SUPABASE_SERVICE_KEY"

    # Generate Dashboard password
    DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD|" .env
    print_success "Generated DASHBOARD_PASSWORD"

    # Generate Secret Key Base (for Realtime)
    SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|SECRET_KEY_BASE=.*|SECRET_KEY_BASE=$SECRET_KEY_BASE|" .env
    print_success "Generated SECRET_KEY_BASE"

    # Generate n8n password
    N8N_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    sed -i "s|N8N_PASSWORD=.*|N8N_PASSWORD=$N8N_PASSWORD|" .env
    print_success "Generated N8N_PASSWORD"

    # Generate n8n DB password
    N8N_DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    sed -i "s|N8N_DB_PASSWORD=.*|N8N_DB_PASSWORD=$N8N_DB_PASSWORD|" .env
    print_success "Generated N8N_DB_PASSWORD"

    echo ""
    print_warning "Generated credentials saved to .env"
    echo ""
    echo "  Dashboard Login:"
    echo "    Username: admin"
    echo "    Password: $DASHBOARD_PASSWORD"
    echo ""
    echo "  n8n Login:"
    echo "    Username: admin"
    echo "    Password: $N8N_PASSWORD"
    echo ""
fi

# ───────────────────────────────────────────────────────────────
# Create n8n Database User
# ───────────────────────────────────────────────────────────────
print_header "Database Setup Notes"

print_info "The n8n service requires a dedicated database."
echo "After the stack is running, execute:"
echo ""
echo "  docker exec -it lifeos-db psql -U postgres -c \\"
echo "    \"CREATE DATABASE n8n; CREATE USER n8n WITH PASSWORD '\$(grep N8N_DB_PASSWORD .env | cut -d= -f2)'; GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;\""
echo ""

# ───────────────────────────────────────────────────────────────
# Local Development Setup
# ───────────────────────────────────────────────────────────────
print_header "Local Development Setup"

echo "For local development with HTTPS, add these entries to /etc/hosts:"
echo ""
echo "  127.0.0.1 dashboard.localhost"
echo "  127.0.0.1 n8n.localhost"
echo "  127.0.0.1 api.localhost"
echo "  127.0.0.1 studio.localhost"
echo ""

# Check if already in hosts
if grep -q "dashboard.localhost" /etc/hosts 2>/dev/null; then
    print_success "Hosts entries already exist"
else
    print_warning "Run this command to add hosts entries (requires sudo):"
    echo ""
    echo '  echo "127.0.0.1 dashboard.localhost n8n.localhost api.localhost studio.localhost" | sudo tee -a /etc/hosts'
    echo ""
fi

# ───────────────────────────────────────────────────────────────
# Show Configuration Reminder
# ───────────────────────────────────────────────────────────────
print_header "External API Configuration"

print_warning "Remember to configure these API keys in .env:"
echo ""
echo "  Buchhaltungsbutler:"
echo "    - BHB_API_KEY, BHB_API_CLIENT, BHB_API_SECRET"
echo ""
echo "  GetMyInvoices:"
echo "    - GMI_API_KEY"
echo ""
echo "  Microsoft 365:"
echo "    - MS365_CLIENT_ID, MS365_CLIENT_SECRET, MS365_TENANT_ID"
echo ""
echo "  Telegram:"
echo "    - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
echo ""
echo "  OpenAI:"
echo "    - OPENAI_API_KEY"
echo ""
echo "  Garmin (optional):"
echo "    - GARMIN_EMAIL, GARMIN_PASSWORD"
echo ""

# ───────────────────────────────────────────────────────────────
# Start Services?
# ───────────────────────────────────────────────────────────────
print_header "Ready to Start"

echo "Your Life OS is ready to be started!"
echo ""
echo "Commands:"
echo ""
echo "  Start all services:     docker compose up -d"
echo "  View logs:              docker compose logs -f"
echo "  Stop services:          docker compose down"
echo "  Check status:           docker compose ps"
echo ""
echo "Services will be available at:"
echo ""
echo "  Dashboard:      https://dashboard.localhost"
echo "  n8n:            https://n8n.localhost"
echo "  Supabase Studio: https://studio.localhost"
echo "  API:            https://api.localhost"
echo ""
echo "  (or via direct ports in development mode):"
echo "  PostgreSQL:     localhost:5432"
echo "  Kong API:       localhost:8000"
echo "  Studio:         localhost:3000"
echo "  n8n:            localhost:5678"
echo ""

read -p "Start services now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_header "Starting Services"

    docker compose up -d

    echo ""
    print_info "Waiting for services to initialize (30 seconds)..."
    sleep 30

    echo ""
    docker compose ps

    # Create n8n database if postgres is ready
    echo ""
    print_info "Setting up n8n database..."
    N8N_DB_PASS=$(grep N8N_DB_PASSWORD .env | cut -d= -f2)
    docker exec lifeos-db psql -U postgres -c "CREATE DATABASE n8n;" 2>/dev/null || true
    docker exec lifeos-db psql -U postgres -c "CREATE USER n8n WITH PASSWORD '$N8N_DB_PASS';" 2>/dev/null || true
    docker exec lifeos-db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n;" 2>/dev/null || true
    print_success "n8n database configured"

    echo ""
    print_success "Services started!"
    echo ""
    echo "Check logs with: docker compose logs -f [service_name]"
fi

echo ""
print_success "Setup complete!"
