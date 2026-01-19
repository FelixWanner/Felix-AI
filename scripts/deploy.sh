#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Life OS - Deployment Script
# ═══════════════════════════════════════════════════════════════

set -e

# ───────────────────────────────────────────────────────────────
# Configuration
# ───────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REMOTE_USER="${DEPLOY_USER:-lifeos}"
REMOTE_HOST="${DEPLOY_HOST:-}"
REMOTE_DIR="${DEPLOY_DIR:-/home/lifeos/lifeos}"
BRANCH="${DEPLOY_BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ───────────────────────────────────────────────────────────────
# Helper Functions
# ───────────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if [ -z "$REMOTE_HOST" ]; then
        log_error "DEPLOY_HOST environment variable is not set"
        log_info "Usage: DEPLOY_HOST=your-server.com ./scripts/deploy.sh"
        exit 1
    fi

    if ! command -v ssh &> /dev/null; then
        log_error "ssh is required but not installed"
        exit 1
    fi

    if ! command -v rsync &> /dev/null; then
        log_warning "rsync not found, using scp instead"
    fi
}

# ───────────────────────────────────────────────────────────────
# SSH Commands
# ───────────────────────────────────────────────────────────────

ssh_cmd() {
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "${REMOTE_USER}@${REMOTE_HOST}" "$@"
}

# ───────────────────────────────────────────────────────────────
# Deployment Functions
# ───────────────────────────────────────────────────────────────

deploy_pull() {
    log_info "Pulling latest changes from git..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        git fetch origin
        git checkout ${BRANCH}
        git pull origin ${BRANCH}
EOF

    log_success "Git pull completed"
}

deploy_build() {
    log_info "Building Docker images..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        docker compose -f docker-compose.yml -f docker-compose.prod.yml build --pull
EOF

    log_success "Docker build completed"
}

deploy_up() {
    log_info "Starting containers..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
EOF

    log_success "Containers started"
}

deploy_down() {
    log_info "Stopping containers..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        docker compose -f docker-compose.yml -f docker-compose.prod.yml down
EOF

    log_success "Containers stopped"
}

deploy_restart() {
    log_info "Restarting containers..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
EOF

    log_success "Containers restarted"
}

deploy_logs() {
    local service="${1:-}"
    log_info "Fetching logs..."

    if [ -n "$service" ]; then
        ssh_cmd "cd ${REMOTE_DIR} && docker compose logs -f --tail=100 $service"
    else
        ssh_cmd "cd ${REMOTE_DIR} && docker compose logs -f --tail=100"
    fi
}

deploy_status() {
    log_info "Checking container status..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}
        echo ""
        echo "=== Container Status ==="
        docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
        echo ""
        echo "=== Resource Usage ==="
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        echo ""
        echo "=== Disk Usage ==="
        df -h /
        echo ""
        echo "=== Docker Disk Usage ==="
        docker system df
EOF
}

deploy_health() {
    log_info "Running health checks..."

    local all_healthy=true

    # Check if containers are running
    log_info "Checking container health..."

    ssh_cmd << 'EOF'
        cd /home/lifeos/lifeos

        echo "Checking containers..."
        unhealthy=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml ps --format json | jq -r 'select(.Health != "healthy" and .Health != "") | .Service')

        if [ -n "$unhealthy" ]; then
            echo "Unhealthy containers:"
            echo "$unhealthy"
            exit 1
        fi

        echo "All containers healthy!"

        # Check HTTP endpoints
        echo ""
        echo "Checking HTTP endpoints..."

        # Frontend
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            echo "✓ Frontend: OK"
        else
            echo "✗ Frontend: FAILED"
        fi

        # Supabase API
        if curl -sf http://localhost:8000/rest/v1/ > /dev/null 2>&1; then
            echo "✓ Supabase API: OK"
        else
            echo "✗ Supabase API: FAILED"
        fi

        # n8n
        if curl -sf http://localhost:5678/healthz > /dev/null 2>&1; then
            echo "✓ n8n: OK"
        else
            echo "✗ n8n: FAILED"
        fi

        # Database
        if docker exec lifeos-db pg_isready -U postgres > /dev/null 2>&1; then
            echo "✓ Database: OK"
        else
            echo "✗ Database: FAILED"
        fi
EOF

    log_success "Health check completed"
}

deploy_cleanup() {
    log_info "Cleaning up old Docker resources..."

    ssh_cmd << EOF
        # Remove unused images
        docker image prune -af

        # Remove unused volumes (be careful!)
        # docker volume prune -f

        # Remove unused networks
        docker network prune -f

        # Remove build cache
        docker builder prune -af

        echo ""
        echo "=== Disk Usage After Cleanup ==="
        docker system df
EOF

    log_success "Cleanup completed"
}

deploy_rollback() {
    log_info "Rolling back to previous version..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}

        # Get previous commit
        PREVIOUS_COMMIT=\$(git rev-parse HEAD~1)
        echo "Rolling back to: \$PREVIOUS_COMMIT"

        # Checkout previous commit
        git checkout \$PREVIOUS_COMMIT

        # Rebuild and restart
        docker compose -f docker-compose.yml -f docker-compose.prod.yml build
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
EOF

    log_success "Rollback completed"
}

deploy_migrate() {
    log_info "Running database migrations..."

    ssh_cmd << EOF
        cd ${REMOTE_DIR}

        # Run migrations
        for migration in supabase/migrations/*.sql; do
            echo "Running: \$migration"
            docker exec -i lifeos-db psql -U postgres -d postgres < "\$migration"
        done
EOF

    log_success "Migrations completed"
}

deploy_shell() {
    local service="${1:-supabase-db}"
    log_info "Opening shell in $service..."

    ssh -t "${REMOTE_USER}@${REMOTE_HOST}" "docker exec -it lifeos-${service#supabase-} bash || docker exec -it lifeos-${service#supabase-} sh"
}

deploy_full() {
    log_info "Starting full deployment..."
    echo ""

    deploy_pull
    echo ""

    deploy_build
    echo ""

    deploy_up
    echo ""

    # Wait for containers to be ready
    log_info "Waiting for containers to be ready..."
    sleep 10

    deploy_health
    echo ""

    log_success "Full deployment completed!"
}

# ───────────────────────────────────────────────────────────────
# Local Development Functions
# ───────────────────────────────────────────────────────────────

local_up() {
    log_info "Starting local development environment..."
    cd "$PROJECT_DIR"
    docker compose up -d
    log_success "Local environment started"
}

local_down() {
    log_info "Stopping local development environment..."
    cd "$PROJECT_DIR"
    docker compose down
    log_success "Local environment stopped"
}

local_build() {
    log_info "Building local Docker images..."
    cd "$PROJECT_DIR"
    docker compose build
    log_success "Local build completed"
}

# ───────────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────────

show_help() {
    cat << EOF
Life OS Deployment Script

Usage: ./scripts/deploy.sh [command] [options]

Remote Commands (require DEPLOY_HOST):
  pull        Pull latest changes from git
  build       Build Docker images
  up          Start containers
  down        Stop containers
  restart     Restart containers
  logs [svc]  Show container logs (optionally for specific service)
  status      Show container status and resources
  health      Run health checks
  cleanup     Clean up old Docker resources
  rollback    Rollback to previous version
  migrate     Run database migrations
  shell [svc] Open shell in container (default: supabase-db)
  deploy      Full deployment (pull, build, up, health)

Local Commands:
  local:up    Start local development environment
  local:down  Stop local development environment
  local:build Build local Docker images

Environment Variables:
  DEPLOY_HOST   Remote server hostname (required for remote commands)
  DEPLOY_USER   Remote user (default: lifeos)
  DEPLOY_DIR    Remote directory (default: /home/lifeos/lifeos)
  DEPLOY_BRANCH Git branch to deploy (default: main)

Examples:
  DEPLOY_HOST=lifeos.example.com ./scripts/deploy.sh deploy
  DEPLOY_HOST=lifeos.example.com ./scripts/deploy.sh logs n8n
  ./scripts/deploy.sh local:up
EOF
}

main() {
    local command="${1:-help}"
    shift || true

    case "$command" in
        # Remote commands
        pull)
            check_requirements
            deploy_pull
            ;;
        build)
            check_requirements
            deploy_build
            ;;
        up)
            check_requirements
            deploy_up
            ;;
        down)
            check_requirements
            deploy_down
            ;;
        restart)
            check_requirements
            deploy_restart
            ;;
        logs)
            check_requirements
            deploy_logs "$@"
            ;;
        status)
            check_requirements
            deploy_status
            ;;
        health)
            check_requirements
            deploy_health
            ;;
        cleanup)
            check_requirements
            deploy_cleanup
            ;;
        rollback)
            check_requirements
            deploy_rollback
            ;;
        migrate)
            check_requirements
            deploy_migrate
            ;;
        shell)
            check_requirements
            deploy_shell "$@"
            ;;
        deploy)
            check_requirements
            deploy_full
            ;;

        # Local commands
        local:up)
            local_up
            ;;
        local:down)
            local_down
            ;;
        local:build)
            local_build
            ;;

        # Help
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
