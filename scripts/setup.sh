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

    # Generate Supabase JWT Keys
    echo ""
    echo "Generating Supabase JWT keys..."

    # Create a temporary Node.js script to generate JWTs
    cat > /tmp/generate-jwt.js << 'JSEOF'
const crypto = require('crypto');

const secret = process.argv[2];
const role = process.argv[3];

function base64url(source) {
    let encodedSource = Buffer.from(source).toString('base64');
    encodedSource = encodedSource.replace(/=+$/, '');
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    return encodedSource;
}

function createJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerStr = base64url(JSON.stringify(header));
    const payloadStr = base64url(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', secret)
        .update(headerStr + '.' + payloadStr)
        .digest('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return headerStr + '.' + payloadStr + '.' + signature;
}

const payload = {
    role: role,
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

console.log(createJWT(payload, secret));
JSEOF

    # Check if Node.js is available
    if command -v node &> /dev/null; then
        SUPABASE_ANON_KEY=$(node /tmp/generate-jwt.js "$JWT_SECRET" "anon")
        SUPABASE_SERVICE_KEY=$(node /tmp/generate-jwt.js "$JWT_SECRET" "service_role")

        sed -i.bak "s/your-anon-key/$SUPABASE_ANON_KEY/" .env
        sed -i.bak "s/your-service-key/$SUPABASE_SERVICE_KEY/" .env

        print_success "Generated SUPABASE_ANON_KEY"
        print_success "Generated SUPABASE_SERVICE_KEY"

        rm -f /tmp/generate-jwt.js
    else
        print_warning "Node.js not found. Generating JWT keys with openssl fallback..."

        # Fallback: Use Python if available
        if command -v python3 &> /dev/null; then
            SUPABASE_ANON_KEY=$(python3 << PYEOF
import hmac, hashlib, base64, json, time

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

secret = "$JWT_SECRET"
header = base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
payload = base64url_encode(json.dumps({
    "role": "anon",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": int(time.time()) + 315360000
}).encode())
sig = base64url_encode(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
print(f"{header}.{payload}.{sig}")
PYEOF
)
            SUPABASE_SERVICE_KEY=$(python3 << PYEOF
import hmac, hashlib, base64, json, time

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

secret = "$JWT_SECRET"
header = base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
payload = base64url_encode(json.dumps({
    "role": "service_role",
    "iss": "supabase",
    "iat": int(time.time()),
    "exp": int(time.time()) + 315360000
}).encode())
sig = base64url_encode(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
print(f"{header}.{payload}.{sig}")
PYEOF
)
            sed -i.bak "s/your-anon-key/$SUPABASE_ANON_KEY/" .env
            sed -i.bak "s/your-service-key/$SUPABASE_SERVICE_KEY/" .env

            print_success "Generated SUPABASE_ANON_KEY"
            print_success "Generated SUPABASE_SERVICE_KEY"
        else
            print_error "Neither Node.js nor Python3 found. Please install one to generate JWT keys."
            print_warning "You can manually generate keys at: https://supabase.com/docs/guides/self-hosting#api-keys"
        fi
    fi

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
