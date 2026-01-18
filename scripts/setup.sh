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
NC='\033[0m' # No Color

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
print_success "Docker is installed"

# Docker Compose
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed."
    exit 1
fi
print_success "Docker Compose is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# ───────────────────────────────────────────────────────────────
# Setup Environment
# ───────────────────────────────────────────────────────────────
print_header "Setting up Environment"

if [ -f .env ]; then
    print_warning ".env already exists. Skipping..."
else
    cp .env.example .env
    print_success "Created .env from .env.example"
    
    # Generate secrets
    echo ""
    echo "Generating secure secrets..."
    
    # Generate PostgreSQL password
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    sed -i.bak "s/your-super-secret-postgres-password-min-32-chars/$POSTGRES_PASSWORD/" .env
    print_success "Generated POSTGRES_PASSWORD"
    
    # Generate JWT Secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/your-super-secret-jwt-token-with-at-least-32-characters/$JWT_SECRET/" .env
    print_success "Generated JWT_SECRET"
    
    # Generate n8n password
    N8N_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    sed -i.bak "s/your-n8n-password/$N8N_PASSWORD/" .env
    print_success "Generated N8N_PASSWORD"
    
    # Generate n8n DB password
    N8N_DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    sed -i.bak "s/your-n8n-db-password/$N8N_DB_PASSWORD/" .env
    print_success "Generated N8N_DB_PASSWORD"
    
    # Generate Dashboard password
    DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    sed -i.bak "s/your-dashboard-password/$DASHBOARD_PASSWORD/" .env
    print_success "Generated DASHBOARD_PASSWORD"
    
    # Generate Secret Key Base
    SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
    sed -i.bak "s|your-very-long-secret-key-base-for-realtime-service|$SECRET_KEY_BASE|" .env
    print_success "Generated SECRET_KEY_BASE"
    
    # Cleanup backup files
    rm -f .env.bak
    
    echo ""
    print_warning "IMPORTANT: Edit .env and configure your external API keys:"
    echo "  - BHB_API_CLIENT, BHB_API_SECRET, BHB_API_KEY (Buchhaltungsbutler)"
    echo "  - GMI_API_KEY (GetMyInvoices)"
    echo "  - MS365_CLIENT_ID, MS365_CLIENT_SECRET, MS365_TENANT_ID"
    echo "  - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
    echo "  - OPENAI_API_KEY"
    echo "  - GARMIN_EMAIL, GARMIN_PASSWORD"
fi

# ───────────────────────────────────────────────────────────────
# Create Required Directories
# ───────────────────────────────────────────────────────────────
print_header "Creating Directories"

mkdir -p supabase/migrations
mkdir -p supabase/seed
mkdir -p n8n/workflows/wealth
mkdir -p n8n/workflows/productivity
mkdir -p n8n/workflows/health
mkdir -p n8n/workflows/ai-copilot
mkdir -p n8n/credentials
mkdir -p frontend
mkdir -p scripts
mkdir -p docs

print_success "Created directory structure"

# ───────────────────────────────────────────────────────────────
# Add hosts entries (for local development)
# ───────────────────────────────────────────────────────────────
print_header "Local Development Setup"

echo "For local development, add these entries to /etc/hosts:"
echo ""
echo "  127.0.0.1 dashboard.localhost"
echo "  127.0.0.1 n8n.localhost"
echo "  127.0.0.1 api.localhost"
echo "  127.0.0.1 studio.localhost"
echo "  127.0.0.1 storage.localhost"
echo ""

# Check if already in hosts
if grep -q "dashboard.localhost" /etc/hosts 2>/dev/null; then
    print_success "Hosts entries already exist"
else
    print_warning "Run this command to add hosts entries:"
    echo ""
    echo '  echo "127.0.0.1 dashboard.localhost n8n.localhost api.localhost studio.localhost storage.localhost" | sudo tee -a /etc/hosts'
    echo ""
fi

# ───────────────────────────────────────────────────────────────
# Start Services
# ───────────────────────────────────────────────────────────────
print_header "Ready to Start"

echo "Your Life OS is ready to be started!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit .env with your API keys"
echo "  2. Add hosts entries (see above)"
echo "  3. Start the stack:"
echo ""
echo "     docker compose up -d"
echo ""
echo "  4. Wait for services to be healthy:"
echo ""
echo "     docker compose ps"
echo ""
echo "  5. Access the services:"
echo "     - Dashboard: https://dashboard.localhost"
echo "     - n8n:       https://n8n.localhost"
echo "     - Studio:    https://studio.localhost"
echo "     - API:       https://api.localhost"
echo ""

# ───────────────────────────────────────────────────────────────
# Optional: Start now?
# ───────────────────────────────────────────────────────────────
read -p "Start services now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_header "Starting Services"
    docker compose up -d
    
    echo ""
    echo "Waiting for services to start..."
    sleep 10
    
    echo ""
    docker compose ps
    
    echo ""
    print_success "Services started!"
    echo ""
    echo "Check logs with: docker compose logs -f"
fi

echo ""
print_success "Setup complete!"
