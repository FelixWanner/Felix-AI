#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Life OS - Backup Script
# ═══════════════════════════════════════════════════════════════
#
# Creates backups of:
# - PostgreSQL database (full dump)
# - Supabase storage files
# - n8n workflows and credentials
# - Configuration files
#
# Optionally uploads to Hetzner Storage Box
#
# ═══════════════════════════════════════════════════════════════

set -e

# ───────────────────────────────────────────────────────────────
# Configuration
# ───────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-/home/lifeos/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="lifeos_backup_${DATE}"

# Hetzner Storage Box (optional)
STORAGE_BOX_USER="${STORAGE_BOX_USER:-}"
STORAGE_BOX_HOST="${STORAGE_BOX_HOST:-}"
STORAGE_BOX_PATH="${STORAGE_BOX_PATH:-/backups/lifeos}"

# Docker containers
DB_CONTAINER="lifeos-db"
STORAGE_CONTAINER="lifeos-storage"
N8N_CONTAINER="lifeos-n8n"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ───────────────────────────────────────────────────────────────
# Helper Functions
# ───────────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed"
        exit 1
    fi

    # Check if containers are running
    if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
        log_error "Database container ($DB_CONTAINER) is not running"
        exit 1
    fi

    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

    log_success "Requirements check passed"
}

# ───────────────────────────────────────────────────────────────
# Backup Functions
# ───────────────────────────────────────────────────────────────

backup_database() {
    log_info "Backing up PostgreSQL database..."

    local db_backup_file="$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"

    # Create full database dump with compression
    docker exec "$DB_CONTAINER" pg_dumpall -U postgres | gzip > "$db_backup_file"

    local size=$(du -h "$db_backup_file" | cut -f1)
    log_success "Database backup completed: $db_backup_file ($size)"
}

backup_database_schema() {
    log_info "Backing up database schema only..."

    local schema_file="$BACKUP_DIR/$BACKUP_NAME/schema.sql"

    # Schema-only dump (for documentation/recovery)
    docker exec "$DB_CONTAINER" pg_dump -U postgres -s postgres > "$schema_file"

    log_success "Schema backup completed: $schema_file"
}

backup_storage() {
    log_info "Backing up Supabase storage files..."

    local storage_backup_dir="$BACKUP_DIR/$BACKUP_NAME/storage"
    mkdir -p "$storage_backup_dir"

    # Get the storage volume name
    local volume_name=$(docker volume ls --format '{{.Name}}' | grep -E "supabase_storage|lifeos.*storage" | head -1)

    if [ -n "$volume_name" ]; then
        # Copy files from volume using a temporary container
        docker run --rm \
            -v "$volume_name:/source:ro" \
            -v "$storage_backup_dir:/backup" \
            alpine \
            sh -c "cp -r /source/* /backup/ 2>/dev/null || true"

        # Compress storage backup
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/storage.tar.gz" -C "$storage_backup_dir" .
        rm -rf "$storage_backup_dir"

        local size=$(du -h "$BACKUP_DIR/$BACKUP_NAME/storage.tar.gz" | cut -f1)
        log_success "Storage backup completed: storage.tar.gz ($size)"
    else
        log_warning "Storage volume not found, skipping storage backup"
    fi
}

backup_n8n() {
    log_info "Backing up n8n workflows and data..."

    local n8n_backup_dir="$BACKUP_DIR/$BACKUP_NAME/n8n"
    mkdir -p "$n8n_backup_dir"

    # Export n8n workflows via API (if available)
    if docker ps --format '{{.Names}}' | grep -q "$N8N_CONTAINER"; then
        # Get the n8n volume
        local volume_name=$(docker volume ls --format '{{.Name}}' | grep -E "n8n_data|lifeos.*n8n" | head -1)

        if [ -n "$volume_name" ]; then
            # Copy n8n data from volume
            docker run --rm \
                -v "$volume_name:/source:ro" \
                -v "$n8n_backup_dir:/backup" \
                alpine \
                sh -c "cp -r /source/* /backup/ 2>/dev/null || true"

            # Compress n8n backup
            tar -czf "$BACKUP_DIR/$BACKUP_NAME/n8n.tar.gz" -C "$n8n_backup_dir" .
            rm -rf "$n8n_backup_dir"

            local size=$(du -h "$BACKUP_DIR/$BACKUP_NAME/n8n.tar.gz" | cut -f1)
            log_success "n8n backup completed: n8n.tar.gz ($size)"
        else
            log_warning "n8n volume not found"
        fi
    else
        log_warning "n8n container not running, skipping n8n backup"
    fi
}

backup_config() {
    log_info "Backing up configuration files..."

    local config_backup_dir="$BACKUP_DIR/$BACKUP_NAME/config"
    mkdir -p "$config_backup_dir"

    # Backup .env (without sensitive data logged)
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$config_backup_dir/.env"
        log_info "Backed up .env file"
    fi

    # Backup docker-compose files
    cp "$PROJECT_DIR/docker-compose.yml" "$config_backup_dir/" 2>/dev/null || true
    cp "$PROJECT_DIR/docker-compose.prod.yml" "$config_backup_dir/" 2>/dev/null || true

    # Backup Caddy configuration
    if [ -d "$PROJECT_DIR/caddy" ]; then
        cp -r "$PROJECT_DIR/caddy" "$config_backup_dir/"
    fi

    # Backup Supabase configuration
    if [ -d "$PROJECT_DIR/supabase" ]; then
        cp -r "$PROJECT_DIR/supabase" "$config_backup_dir/"
    fi

    # Compress config backup
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/config.tar.gz" -C "$config_backup_dir" .
    rm -rf "$config_backup_dir"

    log_success "Configuration backup completed: config.tar.gz"
}

create_backup_archive() {
    log_info "Creating final backup archive..."

    cd "$BACKUP_DIR"

    # Create single archive of all backups
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

    # Remove temporary directory
    rm -rf "$BACKUP_NAME"

    local size=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log_success "Final backup archive created: ${BACKUP_NAME}.tar.gz ($size)"

    # Create checksum
    sha256sum "${BACKUP_NAME}.tar.gz" > "${BACKUP_NAME}.tar.gz.sha256"
    log_info "Checksum created: ${BACKUP_NAME}.tar.gz.sha256"
}

# ───────────────────────────────────────────────────────────────
# Upload Functions
# ───────────────────────────────────────────────────────────────

upload_to_storage_box() {
    if [ -z "$STORAGE_BOX_USER" ] || [ -z "$STORAGE_BOX_HOST" ]; then
        log_info "Storage Box not configured, skipping upload"
        return 0
    fi

    log_info "Uploading backup to Hetzner Storage Box..."

    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    local checksum_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz.sha256"

    # Create remote directory if it doesn't exist
    ssh "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" "mkdir -p ${STORAGE_BOX_PATH}" 2>/dev/null || true

    # Upload using rsync (with progress) or scp
    if command -v rsync &> /dev/null; then
        rsync -avz --progress \
            "$backup_file" \
            "$checksum_file" \
            "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}:${STORAGE_BOX_PATH}/"
    else
        scp "$backup_file" "$checksum_file" \
            "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}:${STORAGE_BOX_PATH}/"
    fi

    log_success "Backup uploaded to Storage Box"
}

# ───────────────────────────────────────────────────────────────
# Cleanup Functions
# ───────────────────────────────────────────────────────────────

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    # Local cleanup
    find "$BACKUP_DIR" -name "lifeos_backup_*.tar.gz*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    local count=$(find "$BACKUP_DIR" -name "lifeos_backup_*.tar.gz" | wc -l)
    log_info "Remaining local backups: $count"

    # Remote cleanup (if Storage Box configured)
    if [ -n "$STORAGE_BOX_USER" ] && [ -n "$STORAGE_BOX_HOST" ]; then
        ssh "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" \
            "find ${STORAGE_BOX_PATH} -name 'lifeos_backup_*.tar.gz*' -mtime +$RETENTION_DAYS -delete" 2>/dev/null || true
        log_info "Remote backups cleaned"
    fi

    log_success "Cleanup completed"
}

list_backups() {
    log_info "Available backups:"
    echo ""

    # Local backups
    echo "Local backups ($BACKUP_DIR):"
    echo "────────────────────────────────────────"
    ls -lh "$BACKUP_DIR"/lifeos_backup_*.tar.gz 2>/dev/null || echo "No local backups found"
    echo ""

    # Remote backups
    if [ -n "$STORAGE_BOX_USER" ] && [ -n "$STORAGE_BOX_HOST" ]; then
        echo "Remote backups (Storage Box):"
        echo "────────────────────────────────────────"
        ssh "${STORAGE_BOX_USER}@${STORAGE_BOX_HOST}" \
            "ls -lh ${STORAGE_BOX_PATH}/lifeos_backup_*.tar.gz" 2>/dev/null || echo "No remote backups found"
    fi
}

# ───────────────────────────────────────────────────────────────
# Restore Functions
# ───────────────────────────────────────────────────────────────

restore_database() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        log_error "Please specify a backup file"
        exit 1
    fi

    log_warning "This will OVERWRITE the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    log_info "Restoring database from $backup_file..."

    # Extract if it's a full backup archive
    if [[ "$backup_file" == *.tar.gz ]]; then
        local temp_dir=$(mktemp -d)
        tar -xzf "$backup_file" -C "$temp_dir"
        backup_file=$(find "$temp_dir" -name "database.sql.gz" | head -1)

        if [ -z "$backup_file" ]; then
            log_error "No database dump found in archive"
            rm -rf "$temp_dir"
            exit 1
        fi
    fi

    # Restore database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i "$DB_CONTAINER" psql -U postgres
    else
        docker exec -i "$DB_CONTAINER" psql -U postgres < "$backup_file"
    fi

    # Cleanup temp directory if used
    [ -n "${temp_dir:-}" ] && rm -rf "$temp_dir"

    log_success "Database restored successfully"
}

# ───────────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────────

show_help() {
    cat << EOF
Life OS Backup Script

Usage: ./scripts/backup.sh [command] [options]

Commands:
  backup      Create full backup (default)
  db          Backup database only
  storage     Backup storage files only
  n8n         Backup n8n data only
  config      Backup configuration only
  upload      Upload latest backup to Storage Box
  list        List available backups
  cleanup     Remove old backups
  restore     Restore database from backup

Options:
  --no-upload     Skip upload to Storage Box
  --no-cleanup    Skip cleanup of old backups

Environment Variables:
  BACKUP_DIR              Local backup directory (default: /home/lifeos/backups)
  BACKUP_RETENTION_DAYS   Days to keep backups (default: 30)
  STORAGE_BOX_USER        Hetzner Storage Box username
  STORAGE_BOX_HOST        Hetzner Storage Box hostname (e.g., u123456.your-storagebox.de)
  STORAGE_BOX_PATH        Remote backup path (default: /backups/lifeos)

Examples:
  ./scripts/backup.sh                     # Full backup with upload
  ./scripts/backup.sh --no-upload         # Full backup without upload
  ./scripts/backup.sh db                  # Database backup only
  ./scripts/backup.sh list                # List all backups
  ./scripts/backup.sh restore backup.tar.gz  # Restore from backup

Cron Example (daily at 3 AM):
  0 3 * * * /home/lifeos/lifeos/scripts/backup.sh >> /var/log/lifeos-backup.log 2>&1
EOF
}

main() {
    local command="${1:-backup}"
    local skip_upload=false
    local skip_cleanup=false

    # Parse arguments
    for arg in "$@"; do
        case "$arg" in
            --no-upload)
                skip_upload=true
                ;;
            --no-cleanup)
                skip_cleanup=true
                ;;
        esac
    done

    case "$command" in
        backup)
            log_info "Starting full backup..."
            echo ""

            check_requirements

            backup_database
            backup_database_schema
            backup_storage
            backup_n8n
            backup_config
            create_backup_archive

            if [ "$skip_upload" = false ]; then
                upload_to_storage_box
            fi

            if [ "$skip_cleanup" = false ]; then
                cleanup_old_backups
            fi

            echo ""
            log_success "Backup completed successfully!"
            echo "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
            ;;

        db|database)
            check_requirements
            backup_database
            backup_database_schema
            create_backup_archive
            log_success "Database backup completed"
            ;;

        storage)
            check_requirements
            backup_storage
            create_backup_archive
            log_success "Storage backup completed"
            ;;

        n8n)
            check_requirements
            backup_n8n
            create_backup_archive
            log_success "n8n backup completed"
            ;;

        config)
            check_requirements
            backup_config
            create_backup_archive
            log_success "Config backup completed"
            ;;

        upload)
            upload_to_storage_box
            ;;

        list)
            list_backups
            ;;

        cleanup)
            cleanup_old_backups
            ;;

        restore)
            restore_database "$2"
            ;;

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
