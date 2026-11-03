#!/bin/bash
set -eo pipefail

# =============================================================================
# DrGame Platform — Production Auto-Deploy Script
# Polled every 1 minute via systemd timer (drgame-autodeploy.timer)
# Zero overhead when no new commits are found.
# =============================================================================

REPO_DIR="/opt/DrGame-Ecommerce"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"
LOCK_FILE="/tmp/drgame_deploy.lock"
LOG_FILE="/var/log/drgame-deploy.log"

# Prevent concurrent deploy executions
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    exit 0
fi

cd "$REPO_DIR"

# Get current local HEAD hash
LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")

# Query remote HEAD hash without downloading objects (~1-2KB network query)
REMOTE_HASH=$(git ls-remote origin refs/heads/main 2>/dev/null | awk '{print $1}')

if [ -z "$REMOTE_HASH" ]; then
    exit 0
fi

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    # Repository is completely up-to-date, exit immediately with zero CPU consumption
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] New commit detected: $LOCAL_HASH -> $REMOTE_HASH" >> "$LOG_FILE"

# Identify changed files between local and remote
CHANGED_FILES=$(git diff --name-only "$LOCAL_HASH" "$REMOTE_HASH" 2>/dev/null || true)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changed files:" >> "$LOG_FILE"
echo "$CHANGED_FILES" >> "$LOG_FILE"

# Pull the new changes
git pull origin main >> "$LOG_FILE" 2>&1

# Auto-generate or update Xray proxy config if V2RAY_SUB_URL is defined in .env
if grep -q "^V2RAY_SUB_URL=" .env 2>/dev/null; then
    if [ ! -f "proxy/config.json" ] || echo "$CHANGED_FILES" | grep -q -E "update_proxy|docker-compose|\.env"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Updating Xray proxy config..." >> "$LOG_FILE"
        python3 scripts/update_proxy.py >> "$LOG_FILE" 2>&1 || true
        docker compose -f "$COMPOSE_FILE" up -d proxy >> "$LOG_FILE" 2>&1 || true
    fi
fi

REBUILD_BACKEND=false
REBUILD_FRONTEND=false
REBUILD_ADMIN=false

# Smart change detection to avoid unnecessary Next.js builds on 1-core VPS
if echo "$CHANGED_FILES" | grep -q -E "^backend/|^requirements.txt"; then
    REBUILD_BACKEND=true
fi

if echo "$CHANGED_FILES" | grep -q -E "^frontend/"; then
    REBUILD_FRONTEND=true
fi

if echo "$CHANGED_FILES" | grep -q -E "^admin-panel/"; then
    REBUILD_ADMIN=true
fi

if echo "$CHANGED_FILES" | grep -q -E "docker-compose|\.env"; then
    REBUILD_BACKEND=true
    REBUILD_FRONTEND=true
    REBUILD_ADMIN=true
fi

# Apply container updates sequentially
if [ "$REBUILD_BACKEND" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building and restarting backend..." >> "$LOG_FILE"
    docker compose -f "$COMPOSE_FILE" build backend >> "$LOG_FILE" 2>&1
    docker compose -f "$COMPOSE_FILE" up -d backend >> "$LOG_FILE" 2>&1
fi

if [ "$REBUILD_ADMIN" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building and restarting admin-panel..." >> "$LOG_FILE"
    docker compose -f "$COMPOSE_FILE" build admin-panel >> "$LOG_FILE" 2>&1
    docker compose -f "$COMPOSE_FILE" up -d admin-panel >> "$LOG_FILE" 2>&1
fi

if [ "$REBUILD_FRONTEND" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building and restarting frontend..." >> "$LOG_FILE"
    docker compose -f "$COMPOSE_FILE" build frontend >> "$LOG_FILE" 2>&1
    docker compose -f "$COMPOSE_FILE" up -d frontend >> "$LOG_FILE" 2>&1
fi

# Clean up dangling images to keep VPS disk space healthy
docker image prune -f >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully for commit $REMOTE_HASH." >> "$LOG_FILE"
