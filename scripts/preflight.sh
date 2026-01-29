#!/bin/bash
#
# Felix-AI Preflight Script
# Automatische Installation aller Abhängigkeiten und Konfiguration
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/FelixWanner/Felix-AI/main/scripts/preflight.sh | bash
#   oder: ./scripts/preflight.sh
#

set -e

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/felix-ai-preflight.log"

# Minimum requirements
MIN_DOCKER_VERSION="20.10"
MIN_COMPOSE_VERSION="2.0"
MIN_MEMORY_GB=4
MIN_DISK_GB=20

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_header() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BOLD}${BLUE}  $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${CYAN}▶${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Dieses Script muss als root ausgeführt werden."
        log_info "Bitte mit 'sudo ./scripts/preflight.sh' erneut ausführen."
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        OS_NAME=$PRETTY_NAME
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        OS_VERSION=$(cat /etc/debian_version)
        OS_NAME="Debian $OS_VERSION"
    elif [[ -f /etc/redhat-release ]]; then
        OS="rhel"
        OS_NAME=$(cat /etc/redhat-release)
    else
        OS="unknown"
        OS_NAME="Unknown"
    fi

    log_info "Erkanntes Betriebssystem: ${OS_NAME}"
}

# Compare versions
version_gte() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# ═══════════════════════════════════════════════════════════════
# SYSTEM CHECKS
# ═══════════════════════════════════════════════════════════════

check_system_requirements() {
    log_header "System-Anforderungen prüfen"

    local errors=0

    # Check CPU cores
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -ge 2 ]]; then
        log_success "CPU: ${cpu_cores} Kerne (min. 2)"
    else
        log_warning "CPU: ${cpu_cores} Kern(e) - empfohlen sind min. 2"
    fi

    # Check RAM
    local total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_mem_gb=$((total_mem_kb / 1024 / 1024))
    if [[ $total_mem_gb -ge $MIN_MEMORY_GB ]]; then
        log_success "RAM: ${total_mem_gb}GB (min. ${MIN_MEMORY_GB}GB)"
    else
        log_error "RAM: ${total_mem_gb}GB - benötigt werden min. ${MIN_MEMORY_GB}GB"
        errors=$((errors + 1))
    fi

    # Check Disk space
    local disk_free_gb=$(df -BG "${PROJECT_ROOT}" 2>/dev/null | tail -1 | awk '{print $4}' | tr -d 'G')
    if [[ -z "$disk_free_gb" ]]; then
        disk_free_gb=$(df -BG / | tail -1 | awk '{print $4}' | tr -d 'G')
    fi
    if [[ $disk_free_gb -ge $MIN_DISK_GB ]]; then
        log_success "Festplatte: ${disk_free_gb}GB frei (min. ${MIN_DISK_GB}GB)"
    else
        log_error "Festplatte: ${disk_free_gb}GB frei - benötigt werden min. ${MIN_DISK_GB}GB"
        errors=$((errors + 1))
    fi

    # Check architecture
    local arch=$(uname -m)
    if [[ "$arch" == "x86_64" || "$arch" == "aarch64" ]]; then
        log_success "Architektur: ${arch}"
    else
        log_warning "Architektur: ${arch} - möglicherweise nicht vollständig unterstützt"
    fi

    return $errors
}

# ═══════════════════════════════════════════════════════════════
# PACKAGE INSTALLATION
# ═══════════════════════════════════════════════════════════════

install_base_packages() {
    log_header "Basis-Pakete installieren"

    case "$OS" in
        ubuntu|debian|pop)
            log_step "APT-Cache aktualisieren..."
            apt-get update -qq >> "$LOG_FILE" 2>&1

            log_step "Basis-Pakete installieren..."
            DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
                curl \
                wget \
                git \
                jq \
                unzip \
                htop \
                nano \
                ca-certificates \
                gnupg \
                lsb-release \
                software-properties-common \
                apt-transport-https \
                openssl \
                net-tools \
                dnsutils \
                >> "$LOG_FILE" 2>&1
            ;;
        centos|rhel|fedora|rocky|alma)
            log_step "DNF/YUM-Cache aktualisieren..."
            if command -v dnf &> /dev/null; then
                dnf update -y -q >> "$LOG_FILE" 2>&1
                dnf install -y -q \
                    curl wget git jq unzip htop nano \
                    ca-certificates gnupg openssl \
                    net-tools bind-utils \
                    >> "$LOG_FILE" 2>&1
            else
                yum update -y -q >> "$LOG_FILE" 2>&1
                yum install -y -q \
                    curl wget git jq unzip htop nano \
                    ca-certificates gnupg openssl \
                    net-tools bind-utils \
                    >> "$LOG_FILE" 2>&1
            fi
            ;;
        arch|manjaro)
            log_step "Pacman-Cache aktualisieren..."
            pacman -Sy --noconfirm >> "$LOG_FILE" 2>&1
            pacman -S --noconfirm --needed \
                curl wget git jq unzip htop nano \
                ca-certificates gnupg openssl \
                net-tools bind \
                >> "$LOG_FILE" 2>&1
            ;;
        alpine)
            log_step "APK-Cache aktualisieren..."
            apk update >> "$LOG_FILE" 2>&1
            apk add --no-cache \
                curl wget git jq unzip htop nano \
                ca-certificates gnupg openssl \
                net-tools bind-tools bash \
                >> "$LOG_FILE" 2>&1
            ;;
        *)
            log_warning "Unbekanntes Betriebssystem - Basis-Pakete müssen manuell installiert werden"
            return 1
            ;;
    esac

    log_success "Basis-Pakete installiert"
}

# ═══════════════════════════════════════════════════════════════
# DOCKER INSTALLATION
# ═══════════════════════════════════════════════════════════════

install_docker() {
    log_header "Docker installieren"

    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | grep -oP '\d+\.\d+' | head -1)
        if version_gte "$docker_version" "$MIN_DOCKER_VERSION"; then
            log_success "Docker bereits installiert: v${docker_version}"
            return 0
        else
            log_warning "Docker Version ${docker_version} ist veraltet, aktualisiere..."
        fi
    fi

    log_step "Docker installieren..."

    case "$OS" in
        ubuntu|debian|pop)
            # Remove old versions
            apt-get remove -y docker docker-engine docker.io containerd runc >> "$LOG_FILE" 2>&1 || true

            # Add Docker GPG key
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/${OS}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>> "$LOG_FILE"
            chmod a+r /etc/apt/keyrings/docker.gpg

            # Add Docker repository
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS} \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                tee /etc/apt/sources.list.d/docker.list > /dev/null

            # Install Docker
            apt-get update -qq >> "$LOG_FILE" 2>&1
            apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> "$LOG_FILE" 2>&1
            ;;
        centos|rhel|rocky|alma)
            # Remove old versions
            yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine >> "$LOG_FILE" 2>&1 || true

            # Install Docker
            yum install -y yum-utils >> "$LOG_FILE" 2>&1
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo >> "$LOG_FILE" 2>&1
            yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> "$LOG_FILE" 2>&1
            ;;
        fedora)
            # Remove old versions
            dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine >> "$LOG_FILE" 2>&1 || true

            # Install Docker
            dnf -y install dnf-plugins-core >> "$LOG_FILE" 2>&1
            dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo >> "$LOG_FILE" 2>&1
            dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >> "$LOG_FILE" 2>&1
            ;;
        arch|manjaro)
            pacman -S --noconfirm docker docker-compose >> "$LOG_FILE" 2>&1
            ;;
        alpine)
            apk add --no-cache docker docker-cli-compose >> "$LOG_FILE" 2>&1
            ;;
        *)
            # Fallback: Use convenience script
            log_step "Verwende Docker Convenience-Script..."
            curl -fsSL https://get.docker.com | sh >> "$LOG_FILE" 2>&1
            ;;
    esac

    # Start and enable Docker
    log_step "Docker-Dienst starten..."
    systemctl enable docker >> "$LOG_FILE" 2>&1 || true
    systemctl start docker >> "$LOG_FILE" 2>&1 || service docker start >> "$LOG_FILE" 2>&1

    # Verify installation
    if docker --version >> "$LOG_FILE" 2>&1; then
        local docker_version=$(docker --version | grep -oP '\d+\.\d+' | head -1)
        log_success "Docker installiert: v${docker_version}"
    else
        log_error "Docker-Installation fehlgeschlagen"
        return 1
    fi
}

install_docker_compose() {
    log_header "Docker Compose prüfen"

    # Check if docker compose (plugin) is available
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version | grep -oP '\d+\.\d+' | head -1)
        log_success "Docker Compose Plugin: v${compose_version}"
        return 0
    fi

    # Check for standalone docker-compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | grep -oP '\d+\.\d+' | head -1)
        if version_gte "$compose_version" "$MIN_COMPOSE_VERSION"; then
            log_success "Docker Compose Standalone: v${compose_version}"
            return 0
        fi
    fi

    log_step "Docker Compose Plugin installieren..."

    case "$OS" in
        ubuntu|debian|pop)
            apt-get install -y -qq docker-compose-plugin >> "$LOG_FILE" 2>&1
            ;;
        centos|rhel|rocky|alma|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y -q docker-compose-plugin >> "$LOG_FILE" 2>&1
            else
                yum install -y -q docker-compose-plugin >> "$LOG_FILE" 2>&1
            fi
            ;;
        *)
            # Install standalone
            local COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')
            curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose >> "$LOG_FILE" 2>&1
            chmod +x /usr/local/bin/docker-compose
            ;;
    esac

    if docker compose version &> /dev/null; then
        log_success "Docker Compose installiert"
    else
        log_error "Docker Compose Installation fehlgeschlagen"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════
# FIREWALL CONFIGURATION
# ═══════════════════════════════════════════════════════════════

configure_firewall() {
    log_header "Firewall konfigurieren"

    # Check for UFW (Ubuntu/Debian)
    if command -v ufw &> /dev/null; then
        log_step "UFW-Firewall konfigurieren..."

        # Enable UFW
        ufw --force enable >> "$LOG_FILE" 2>&1 || true

        # Allow SSH
        ufw allow 22/tcp >> "$LOG_FILE" 2>&1
        log_success "SSH (Port 22) erlaubt"

        # Allow HTTP/HTTPS
        ufw allow 80/tcp >> "$LOG_FILE" 2>&1
        ufw allow 443/tcp >> "$LOG_FILE" 2>&1
        log_success "HTTP/HTTPS (Port 80, 443) erlaubt"

        # Reload
        ufw reload >> "$LOG_FILE" 2>&1
        log_success "UFW-Firewall konfiguriert"

    # Check for firewalld (CentOS/RHEL/Fedora)
    elif command -v firewall-cmd &> /dev/null; then
        log_step "Firewalld konfigurieren..."

        systemctl enable firewalld >> "$LOG_FILE" 2>&1 || true
        systemctl start firewalld >> "$LOG_FILE" 2>&1 || true

        firewall-cmd --permanent --add-service=ssh >> "$LOG_FILE" 2>&1
        firewall-cmd --permanent --add-service=http >> "$LOG_FILE" 2>&1
        firewall-cmd --permanent --add-service=https >> "$LOG_FILE" 2>&1
        firewall-cmd --reload >> "$LOG_FILE" 2>&1

        log_success "Firewalld konfiguriert"
    else
        log_warning "Keine unterstützte Firewall gefunden - bitte manuell konfigurieren"
    fi
}

# ═══════════════════════════════════════════════════════════════
# PROJECT SETUP
# ═══════════════════════════════════════════════════════════════

setup_project_directories() {
    log_header "Projektverzeichnisse einrichten"

    cd "$PROJECT_ROOT"

    # Create necessary directories
    local dirs=(
        "logs"
        "backups"
        "caddy/data"
        "caddy/config"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_success "Verzeichnis erstellt: $dir"
        fi
    done

    # Set permissions
    chmod +x scripts/*.sh 2>/dev/null || true
    log_success "Script-Berechtigungen gesetzt"
}

setup_environment() {
    log_header "Umgebungsvariablen einrichten"

    cd "$PROJECT_ROOT"

    if [[ -f ".env" ]]; then
        log_info ".env existiert bereits"

        # Check for empty/placeholder values
        local missing_vars=0
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

            # Check for placeholder values
            if [[ "$value" =~ ^your- || "$value" =~ ^sk-your || -z "$value" ]]; then
                missing_vars=$((missing_vars + 1))
            fi
        done < .env

        if [[ $missing_vars -gt 0 ]]; then
            log_warning "$missing_vars Variablen müssen noch konfiguriert werden"
        fi
    else
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_success ".env aus .env.example erstellt"

            # Generate secure passwords
            log_step "Sichere Passwörter generieren..."

            # Generate random passwords
            local postgres_pw=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
            local jwt_secret=$(openssl rand -base64 32)
            local n8n_pw=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
            local n8n_db_pw=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
            local dashboard_pw=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
            local secret_key_base=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)

            # Update .env with generated values
            sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgres_pw}|" .env
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
            sed -i "s|N8N_PASSWORD=.*|N8N_PASSWORD=${n8n_pw}|" .env
            sed -i "s|N8N_DB_PASSWORD=.*|N8N_DB_PASSWORD=${n8n_db_pw}|" .env
            sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=${dashboard_pw}|" .env
            sed -i "s|SECRET_KEY_BASE=.*|SECRET_KEY_BASE=${secret_key_base}|" .env

            log_success "Sichere Passwörter generiert"

            # Show generated credentials
            echo ""
            log_info "═══════════════════════════════════════════════════════════════"
            log_info "Generierte Zugangsdaten (bitte notieren!):"
            log_info "═══════════════════════════════════════════════════════════════"
            echo -e "${YELLOW}N8N Login:${NC}"
            echo -e "  User: admin"
            echo -e "  Password: ${n8n_pw}"
            echo ""
            echo -e "${YELLOW}Supabase Dashboard:${NC}"
            echo -e "  User: admin"
            echo -e "  Password: ${dashboard_pw}"
            log_info "═══════════════════════════════════════════════════════════════"
            echo ""
        else
            log_error ".env.example nicht gefunden"
            return 1
        fi
    fi

    log_warning "Bitte .env bearbeiten und fehlende Werte eintragen:"
    log_info "  - TELEGRAM_BOT_TOKEN"
    log_info "  - OPENAI_API_KEY"
    log_info "  - Domain-Einstellungen (DOMAIN, N8N_HOST)"
    log_info "  - Optional: Banking APIs, Garmin, etc."
}

generate_supabase_keys() {
    log_header "Supabase API Keys generieren"

    cd "$PROJECT_ROOT"

    # Read JWT secret from .env
    local jwt_secret=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2-)

    if [[ -z "$jwt_secret" || "$jwt_secret" == "your-"* ]]; then
        jwt_secret=$(openssl rand -base64 32)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
    fi

    log_step "Generiere Supabase Anon Key..."

    # Generate anon key (role: anon, exp: 10 years)
    local anon_payload=$(echo -n '{"role":"anon","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')
    local anon_header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')
    local anon_signature=$(echo -n "${anon_header}.${anon_payload}" | openssl dgst -sha256 -hmac "$jwt_secret" -binary | base64 -w 0 | tr '+/' '-_' | tr -d '=')
    local anon_key="${anon_header}.${anon_payload}.${anon_signature}"

    log_step "Generiere Supabase Service Key..."

    # Generate service_role key
    local service_payload=$(echo -n '{"role":"service_role","iss":"supabase","iat":'$(date +%s)',"exp":'$(($(date +%s) + 315360000))'}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')
    local service_signature=$(echo -n "${anon_header}.${service_payload}" | openssl dgst -sha256 -hmac "$jwt_secret" -binary | base64 -w 0 | tr '+/' '-_' | tr -d '=')
    local service_key="${anon_header}.${service_payload}.${service_signature}"

    # Update .env
    sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${anon_key}|" .env
    sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=${service_key}|" .env

    log_success "Supabase API Keys generiert und in .env gespeichert"
}

# ═══════════════════════════════════════════════════════════════
# DOCKER IMAGES
# ═══════════════════════════════════════════════════════════════

pull_docker_images() {
    log_header "Docker Images herunterladen"

    cd "$PROJECT_ROOT"

    log_step "Images werden heruntergeladen (kann einige Minuten dauern)..."

    # Pull all images
    docker compose pull >> "$LOG_FILE" 2>&1 || {
        log_warning "Einige Images konnten nicht heruntergeladen werden"
    }

    log_success "Docker Images heruntergeladen"
}

# ═══════════════════════════════════════════════════════════════
# SYSTEM TUNING
# ═══════════════════════════════════════════════════════════════

tune_system() {
    log_header "System optimieren"

    # Increase file limits
    log_step "Datei-Limits erhöhen..."

    if ! grep -q "felix-ai" /etc/security/limits.conf 2>/dev/null; then
        cat >> /etc/security/limits.conf << 'EOF'

# Felix-AI - Increased limits
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
EOF
        log_success "Datei-Limits erhöht"
    else
        log_info "Datei-Limits bereits konfiguriert"
    fi

    # Optimize sysctl for Docker
    log_step "Kernel-Parameter optimieren..."

    if [[ ! -f /etc/sysctl.d/99-felix-ai.conf ]]; then
        cat > /etc/sysctl.d/99-felix-ai.conf << 'EOF'
# Felix-AI - Docker optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.core.netdev_max_backlog = 65535
vm.max_map_count = 262144
vm.swappiness = 10
EOF
        sysctl -p /etc/sysctl.d/99-felix-ai.conf >> "$LOG_FILE" 2>&1 || true
        log_success "Kernel-Parameter optimiert"
    else
        log_info "Kernel-Parameter bereits konfiguriert"
    fi
}

# ═══════════════════════════════════════════════════════════════
# VALIDATION
# ═══════════════════════════════════════════════════════════════

validate_setup() {
    log_header "Installation validieren"

    local errors=0

    # Check Docker
    if docker --version &> /dev/null; then
        log_success "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    else
        log_error "Docker nicht verfügbar"
        errors=$((errors + 1))
    fi

    # Check Docker Compose
    if docker compose version &> /dev/null; then
        log_success "Docker Compose: $(docker compose version | cut -d' ' -f4)"
    else
        log_error "Docker Compose nicht verfügbar"
        errors=$((errors + 1))
    fi

    # Check Docker daemon
    if docker info &> /dev/null; then
        log_success "Docker Daemon läuft"
    else
        log_error "Docker Daemon nicht erreichbar"
        errors=$((errors + 1))
    fi

    # Check .env
    if [[ -f "${PROJECT_ROOT}/.env" ]]; then
        log_success ".env Datei vorhanden"
    else
        log_error ".env Datei fehlt"
        errors=$((errors + 1))
    fi

    # Check required tools
    for tool in curl wget jq git openssl; do
        if command -v $tool &> /dev/null; then
            log_success "$tool verfügbar"
        else
            log_error "$tool nicht installiert"
            errors=$((errors + 1))
        fi
    done

    return $errors
}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

main() {
    # Initialize log
    echo "Felix-AI Preflight - $(date)" > "$LOG_FILE"

    echo ""
    echo -e "${BOLD}${GREEN}"
    echo "  ███████╗███████╗██╗     ██╗██╗  ██╗       █████╗ ██╗"
    echo "  ██╔════╝██╔════╝██║     ██║╚██╗██╔╝      ██╔══██╗██║"
    echo "  █████╗  █████╗  ██║     ██║ ╚███╔╝ █████╗███████║██║"
    echo "  ██╔══╝  ██╔══╝  ██║     ██║ ██╔██╗ ╚════╝██╔══██║██║"
    echo "  ██║     ███████╗███████╗██║██╔╝ ██╗      ██║  ██║██║"
    echo "  ╚═╝     ╚══════╝╚══════╝╚═╝╚═╝  ╚═╝      ╚═╝  ╚═╝╚═╝"
    echo -e "${NC}"
    echo -e "${CYAN}  Preflight Setup Script${NC}"
    echo ""

    # Check root
    check_root

    # Detect OS
    detect_os

    # Run setup steps
    check_system_requirements || true
    install_base_packages
    install_docker
    install_docker_compose
    configure_firewall
    tune_system
    setup_project_directories
    setup_environment
    generate_supabase_keys
    pull_docker_images

    # Validate
    echo ""
    if validate_setup; then
        log_header "Setup abgeschlossen!"
        echo ""
        log_success "Felix-AI ist bereit zur Installation!"
        echo ""
        log_info "Nächste Schritte:"
        echo "  1. Bearbeite .env und trage fehlende Werte ein:"
        echo "     ${CYAN}nano .env${NC}"
        echo ""
        echo "  2. Starte Felix-AI:"
        echo "     ${CYAN}docker compose up -d${NC}"
        echo ""
        echo "  3. Prüfe den Status:"
        echo "     ${CYAN}docker compose ps${NC}"
        echo ""
        log_info "Log-Datei: ${LOG_FILE}"
    else
        log_error "Setup mit Fehlern abgeschlossen - siehe Log: ${LOG_FILE}"
        exit 1
    fi
}

# Run main
main "$@"
