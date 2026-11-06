# ==========================================
# Stage 1: base image with Python dependencies
# ==========================================
FROM python:3.12-slim-bookworm AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=config.settings \
    PIP_INDEX_URL=https://package-mirror.liara.ir/repository/pypi/simple

# Configure Debian repositories to use Liara high-speed mirror
RUN sed -i 's|http://deb.debian.org/debian-security|http://linux-mirror.liara.ir/repository/debian-security|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org/debian-security|http://linux-mirror.liara.ir/repository/debian-security|g' /etc/apt/sources.list 2>/dev/null || true && \
    sed -i 's|http://deb.debian.org/debian|http://linux-mirror.liara.ir/repository/debian|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org/debian|http://linux-mirror.liara.ir/repository/debian|g' /etc/apt/sources.list 2>/dev/null || true && \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://package-mirror.liara.ir/repository/pypi/simple -r requirements.txt

# ==========================================
# Stage 2: Development target
# ==========================================
FROM base AS dev

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 8007

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["runserver"]

# ==========================================
# Stage 3: Production target
# ==========================================
FROM base AS prod

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --no-create-home appuser

COPY --chown=appuser:appgroup . .

RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/staticfiles && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8007

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn"]
