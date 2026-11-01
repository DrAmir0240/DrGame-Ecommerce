# ==========================================
# Stage 1: base image with Python dependencies
# ==========================================
FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=config.settings

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

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
