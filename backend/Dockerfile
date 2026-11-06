# =============================================================================
# Backend Dockerfile — FastAPI on Python 3.12-slim
# =============================================================================
FROM python:3.12-slim-bookworm AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_INDEX_URL=https://package-mirror.liara.ir/repository/pypi/simple

# Configure Debian repositories to use Liara high-speed mirror
RUN sed -i 's|http://deb.debian.org/debian-security|http://linux-mirror.liara.ir/repository/debian-security|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org/debian-security|http://linux-mirror.liara.ir/repository/debian-security|g' /etc/apt/sources.list 2>/dev/null || true && \
    sed -i 's|http://deb.debian.org/debian|http://linux-mirror.liara.ir/repository/debian|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org/debian|http://linux-mirror.liara.ir/repository/debian|g' /etc/apt/sources.list 2>/dev/null || true && \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://package-mirror.liara.ir/repository/pypi/simple -r requirements.txt

# Development target (with auto-reload)
FROM base AS dev

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production target
FROM base AS prod

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --no-create-home appuser

COPY --chown=appuser:appgroup . .

RUN mkdir -p /app/static /app/media && \
    chown -R appuser:appgroup /app/media /app/static

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
