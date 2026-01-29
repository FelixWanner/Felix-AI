#!/bin/bash
#
# n8n Initialization Entrypoint
# Waits for n8n, imports workflows, and optionally sets up credentials
#

set -e

# Configuration
N8N_HOST="${N8N_HOST:-n8n}"
N8N_PORT="${N8N_PORT:-5678}"
N8N_API_URL="${N8N_API_URL:-http://${N8N_HOST}:${N8N_PORT}}"
N8N_API_KEY="${N8N_API_KEY:-}"
WORKFLOWS_DIR="${WORKFLOWS_DIR:-/workflows}"
MAX_RETRIES="${MAX_RETRIES:-60}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[n8n-init]${NC} $1"; }
log_success() { echo -e "${GREEN}[n8n-init]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[n8n-init]${NC} $1"; }
log_error() { echo -e "${RED}[n8n-init]${NC} $1"; }

# Build authorization header
get_auth_headers() {
    local headers="-H 'Content-Type: application/json'"
    if [[ -n "$N8N_API_KEY" ]]; then
        headers="$headers -H 'X-N8N-API-KEY: ${N8N_API_KEY}'"
    fi
    echo "$headers"
}

# Wait for n8n to be ready
wait_for_n8n() {
    log_info "Waiting for n8n at ${N8N_API_URL}..."

    local retries=0
    while [[ $retries -lt $MAX_RETRIES ]]; do
        # Try health endpoint first
        if curl -sf "${N8N_API_URL}/healthz" > /dev/null 2>&1; then
            log_success "n8n health check passed!"

            # Also verify API is accessible
            sleep 2
            if curl -sf "${N8N_API_URL}/api/v1/workflows" > /dev/null 2>&1; then
                log_success "n8n API is ready!"
                return 0
            fi
        fi

        retries=$((retries + 1))
        if [[ $((retries % 10)) -eq 0 ]]; then
            log_info "Still waiting... ($retries/$MAX_RETRIES)"
        fi
        sleep $RETRY_INTERVAL
    done

    log_error "n8n did not become ready within $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
    return 1
}

# Get existing workflows
get_existing_workflows() {
    local result
    if [[ -n "$N8N_API_KEY" ]]; then
        result=$(curl -sf -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_API_URL}/api/v1/workflows" 2>/dev/null)
    else
        result=$(curl -sf "${N8N_API_URL}/api/v1/workflows" 2>/dev/null)
    fi
    echo "${result:-{\"data\":[]}}"
}

# Import a workflow
import_workflow() {
    local file="$1"
    local workflow_name=$(jq -r '.name' "$file")

    local curl_opts="-sf -X POST -H 'Content-Type: application/json'"
    if [[ -n "$N8N_API_KEY" ]]; then
        curl_opts="$curl_opts -H 'X-N8N-API-KEY: ${N8N_API_KEY}'"
    fi

    local response
    if [[ -n "$N8N_API_KEY" ]]; then
        response=$(curl -sf -X POST \
            -H "Content-Type: application/json" \
            -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
            -d @"$file" \
            "${N8N_API_URL}/api/v1/workflows" 2>/dev/null)
    else
        response=$(curl -sf -X POST \
            -H "Content-Type: application/json" \
            -d @"$file" \
            "${N8N_API_URL}/api/v1/workflows" 2>/dev/null)
    fi

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        local id=$(echo "$response" | jq -r '.id')
        log_success "Imported: $workflow_name (ID: $id)"
        return 0
    else
        log_warning "Failed to import: $workflow_name"
        return 1
    fi
}

# Update existing workflow
update_workflow() {
    local file="$1"
    local workflow_id="$2"
    local workflow_name=$(jq -r '.name' "$file")

    local response
    if [[ -n "$N8N_API_KEY" ]]; then
        response=$(curl -sf -X PATCH \
            -H "Content-Type: application/json" \
            -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
            -d @"$file" \
            "${N8N_API_URL}/api/v1/workflows/${workflow_id}" 2>/dev/null)
    else
        response=$(curl -sf -X PATCH \
            -H "Content-Type: application/json" \
            -d @"$file" \
            "${N8N_API_URL}/api/v1/workflows/${workflow_id}" 2>/dev/null)
    fi

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        log_success "Updated: $workflow_name (ID: $workflow_id)"
        return 0
    else
        log_warning "Failed to update: $workflow_name"
        return 1
    fi
}

# Import all workflows
import_workflows() {
    log_info "Importing workflows from ${WORKFLOWS_DIR}..."

    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        log_error "Workflows directory not found: ${WORKFLOWS_DIR}"
        return 1
    fi

    local workflow_files=($(find "$WORKFLOWS_DIR" -name "*.json" -type f 2>/dev/null | sort))
    local total=${#workflow_files[@]}

    if [[ $total -eq 0 ]]; then
        log_warning "No workflow files found"
        return 0
    fi

    log_info "Found $total workflow(s) to process"

    # Get existing workflows
    local existing=$(get_existing_workflows)

    local imported=0
    local updated=0
    local skipped=0
    local failed=0

    for file in "${workflow_files[@]}"; do
        local workflow_name=$(jq -r '.name' "$file" 2>/dev/null)

        if [[ -z "$workflow_name" || "$workflow_name" == "null" ]]; then
            log_warning "Skipping invalid file: $(basename "$file")"
            skipped=$((skipped + 1))
            continue
        fi

        # Check if workflow exists
        local existing_id=$(echo "$existing" | jq -r --arg name "$workflow_name" '.data[]? | select(.name == $name) | .id' 2>/dev/null | head -1)

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

        # Small delay to avoid overwhelming the API
        sleep 0.5
    done

    echo ""
    log_info "========================================="
    log_info "Import Complete!"
    log_success "  New: $imported"
    [[ $updated -gt 0 ]] && log_info "  Updated: $updated"
    [[ $skipped -gt 0 ]] && log_warning "  Skipped: $skipped"
    [[ $failed -gt 0 ]] && log_error "  Failed: $failed"
    log_info "========================================="

    return 0
}

# Setup credentials template (informational)
show_credentials_info() {
    log_info ""
    log_info "========================================="
    log_info "Credentials Setup Required"
    log_info "========================================="
    log_info ""
    log_info "The following credentials need to be configured in n8n:"
    log_info ""
    log_info "1. Supabase API"
    log_info "   - Name: Supabase"
    log_info "   - Host: \${SUPABASE_URL}"
    log_info "   - API Key: \${SUPABASE_SERVICE_KEY}"
    log_info ""
    log_info "2. Telegram Bot"
    log_info "   - Name: Telegram Bot"
    log_info "   - Access Token: \${TELEGRAM_BOT_TOKEN}"
    log_info ""
    log_info "3. OpenAI API (HTTP Header Auth)"
    log_info "   - Name: OpenAI API Key"
    log_info "   - Header: Authorization"
    log_info "   - Value: Bearer \${OPENAI_API_KEY}"
    log_info ""
    log_info "4. Microsoft OAuth (for Outlook/Todo)"
    log_info "   - Configure in n8n UI with your Azure App credentials"
    log_info ""
    log_info "========================================="
}

# Main
main() {
    echo ""
    echo "========================================="
    echo "  Felix-AI n8n Workflow Initializer"
    echo "========================================="
    echo ""

    # Wait for n8n
    if ! wait_for_n8n; then
        log_error "Cannot proceed without n8n"
        exit 1
    fi

    # Import workflows
    import_workflows

    # Show credentials info
    show_credentials_info

    log_success ""
    log_success "Initialization complete!"
    log_info "Access n8n at: ${N8N_API_URL}"
    log_info ""
}

main "$@"
