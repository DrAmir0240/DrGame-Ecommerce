#!/usr/bin/env bash
# ==========================================
# DrGame — Django admin panel entrypoint
# ==========================================
# Boot sequence:
#   1. wait for PostgreSQL
#   2. create the `django_admin` schema (Django's own tables live there)
#   3. apply Django's own migrations (never touches the DrGame tables)
#   4. create / refresh the single admin account from the environment
#   5. collect static files and start the server
# ==========================================
set -euo pipefail

APP_HOST="${POSTGRES_HOST:-db}"
APP_PORT="${POSTGRES_PORT:-5432}"
APP_DB="${POSTGRES_DB:-drgame_db}"
APP_USER="${POSTGRES_USER:-drgame_user}"
PANEL_PORT="${DJANGO_ADMIN_PORT:-8007}"
MAX_ATTEMPTS="${DB_WAIT_ATTEMPTS:-30}"

log() { echo "[admin-panel] $*"; }

# ── 1. wait for the database ────────────────────────────────────────────
log "waiting for postgres at ${APP_HOST}:${APP_PORT} ..."
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
    if python -c "
import os, sys, psycopg
try:
    psycopg.connect(
        host=os.environ.get('POSTGRES_HOST', 'db'),
        port=os.environ.get('POSTGRES_PORT', '5432'),
        dbname=os.environ.get('POSTGRES_DB', 'drgame_db'),
        user=os.environ.get('POSTGRES_USER', 'drgame_user'),
        password=os.environ.get('POSTGRES_PASSWORD', ''),
        connect_timeout=3,
    ).close()
except Exception as exc:
    sys.exit(1)
" 2>/dev/null; then
        log "postgres is ready"
        break
    fi
    if [ "${attempt}" -eq "${MAX_ATTEMPTS}" ]; then
        log "FATAL: postgres is not reachable after ${MAX_ATTEMPTS} attempts"
        exit 1
    fi
    sleep 2
done

# ── 2. schema + migrations (Django's own tables only) ───────────────────
log "ensuring the django_admin schema ..."
python manage.py ensure_schema

log "applying django migrations (DrGame tables in public are never touched) ..."
python manage.py migrate --noinput

# ── 3. the single admin account ─────────────────────────────────────────
log "ensuring the admin account ..."
python manage.py ensure_superuser

# ── 4. static files ──────────────────────────────────────────────────────
log "collecting static files ..."
python manage.py collectstatic --noinput --clear >/dev/null 2>&1 || true

# ── 5. serve ────────────────────────────────────────────────────────────
case "${1:-runserver}" in
    runserver)
        log "starting django runserver on 0.0.0.0:${PANEL_PORT}"
        exec python manage.py runserver "0.0.0.0:${PANEL_PORT}"
        ;;
    gunicorn)
        log "starting gunicorn on 0.0.0.0:${PANEL_PORT}"
        exec gunicorn config.wsgi:application \
            --bind "0.0.0.0:${PANEL_PORT}" \
            --workers "${GUNICORN_WORKERS:-3}" \
            --timeout "${GUNICORN_TIMEOUT:-120}" \
            --access-logfile - \
            --error-logfile -
        ;;
    *)
        exec "$@"
        ;;
esac
