#!/bin/bash
#
# n8n Workflow Import Script
# Automatically imports all workflows from n8n/workflows/ directory
#
# Usage:
#   ./scripts/import-n8n-workflows.sh [options]
#
# Options:
#   --wait          Wait for n8n to be ready before importing
#   --api-url URL   n8n API URL (default: http://localhost:5678)
#   --api-key KEY   n8n API key for authentication
#   --dry-run       Show what would be imported without actually importing
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="${PROJECT_ROOT}/n8n/workflows"
N8N_API_URL="${N8N_API_URL:-http://localhost:5678}"
N8N_API_KEY="${N8N_API_KEY:-}"
WAIT_FOR_N8N=false
DRY_RUN=false
MAX_RETRIES=30
RETRY_INTERVAL=2

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --wait)
            WAIT_FOR_N8N=true
            shift
            ;;
        --api-url)
            N8N_API_URL="$2"
            shift 2
            ;;
        --api-key)
            N8N_API_KEY="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

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

# Build authorization header
get_auth_header() {
    if [[ -n "$N8N_API_KEY" ]]; then
        echo "X-N8N-API-KEY: ${N8N_API_KEY}"
    else
        echo ""
    fi
}

# Wait for n8n to be ready
wait_for_n8n() {
    log_info "Waiting for n8n to be ready at ${N8N_API_URL}..."

    local retries=0
    while [[ $retries -lt $MAX_RETRIES ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "${N8N_API_URL}/healthz" 2>/dev/null | grep -q "200"; then
            log_success "n8n is ready!"
            return 0
        fi

        retries=$((retries + 1))
        log_info "Attempt $retries/$MAX_RETRIES - n8n not ready yet, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done

    log_error "n8n did not become ready within $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
    return 1
}

# Get existing workflows
get_existing_workflows() {
    local auth_header=$(get_auth_header)
    local curl_opts=(-s)

    if [[ -n "$auth_header" ]]; then
        curl_opts+=(-H "$auth_header")
    fi

    curl "${curl_opts[@]}" "${N8N_API_URL}/api/v1/workflows" 2>/dev/null || echo '{"data":[]}'
}

# Import a single workflow
import_workflow() {
    local file="$1"
    local filename=$(basename "$file")
    local workflow_name=$(jq -r '.name' "$file")

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would import: $workflow_name ($filename)"
        return 0
    fi

    local auth_header=$(get_auth_header)
    local curl_opts=(-s -X POST)
    curl_opts+=(-H "Content-Type: application/json")

    if [[ -n "$auth_header" ]]; then
        curl_opts+=(-H "$auth_header")
    fi

    # Read and prepare workflow data
    local workflow_data=$(cat "$file")

    # Import via API
    local response=$(curl "${curl_opts[@]}" \
        -d "$workflow_data" \
        "${N8N_API_URL}/api/v1/workflows" 2>/dev/null)

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        local imported_id=$(echo "$response" | jq -r '.id')
        log_success "Imported: $workflow_name (ID: $imported_id)"
        return 0
    else
        local error=$(echo "$response" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
        log_warning "Failed to import $workflow_name: $error"
        return 1
    fi
}

# Update existing workflow
update_workflow() {
    local file="$1"
    local workflow_id="$2"
    local filename=$(basename "$file")
    local workflow_name=$(jq -r '.name' "$file")

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would update: $workflow_name (ID: $workflow_id)"
        return 0
    fi

    local auth_header=$(get_auth_header)
    local curl_opts=(-s -X PATCH)
    curl_opts+=(-H "Content-Type: application/json")

    if [[ -n "$auth_header" ]]; then
        curl_opts+=(-H "$auth_header")
    fi

    # Read workflow data
    local workflow_data=$(cat "$file")

    # Update via API
    local response=$(curl "${curl_opts[@]}" \
        -d "$workflow_data" \
        "${N8N_API_URL}/api/v1/workflows/${workflow_id}" 2>/dev/null)

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Updated: $workflow_name (ID: $workflow_id)"
        return 0
    else
        local error=$(echo "$response" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
        log_warning "Failed to update $workflow_name: $error"
        return 1
    fi
}

# Main import function
import_all_workflows() {
    log_info "Starting workflow import from ${WORKFLOWS_DIR}"

    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        log_error "Workflows directory not found: ${WORKFLOWS_DIR}"
        exit 1
    fi

    # Get list of workflow files
    local workflow_files=($(find "$WORKFLOWS_DIR" -name "*.json" -type f | sort))
    local total=${#workflow_files[@]}

    if [[ $total -eq 0 ]]; then
        log_warning "No workflow files found in ${WORKFLOWS_DIR}"
        exit 0
    fi

    log_info "Found $total workflow file(s) to import"

    # Get existing workflows for comparison
    local existing_workflows=$(get_existing_workflows)

    local imported=0
    local updated=0
    local failed=0

    for file in "${workflow_files[@]}"; do
        local workflow_name=$(jq -r '.name' "$file" 2>/dev/null)

        if [[ -z "$workflow_name" || "$workflow_name" == "null" ]]; then
            log_warning "Skipping invalid workflow file: $(basename "$file")"
            failed=$((failed + 1))
            continue
        fi

        # Check if workflow already exists
        local existing_id=$(echo "$existing_workflows" | jq -r --arg name "$workflow_name" '.data[]? | select(.name == $name) | .id' 2>/dev/null)

        if [[ -n "$existing_id" && "$existing_id" != "null" ]]; then
            if update_workflow "$file" "$existing_id"; then
                updated=$((updated + 1))
            else
                failed=$((failed + 1))
            fi
        else
            if import_workflow "$file"; then
                imported=$((imported + 1))
            else
                failed=$((failed + 1))
            fi
        fi
    done

    echo ""
    log_info "========================================="
    log_info "Import Summary:"
    log_success "  New imports: $imported"
    log_info "  Updated: $updated"
    if [[ $failed -gt 0 ]]; then
        log_warning "  Failed: $failed"
    fi
    log_info "========================================="

    if [[ $failed -gt 0 ]]; then
        return 1
    fi
    return 0
}

# Main execution
main() {
    echo ""
    echo "========================================="
    echo "  n8n Workflow Import Tool"
    echo "========================================="
    echo ""

    if [[ "$WAIT_FOR_N8N" == "true" ]]; then
        wait_for_n8n || exit 1
    fi

    import_all_workflows
}

main "$@"
