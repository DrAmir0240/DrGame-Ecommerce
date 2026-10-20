# =============================================================================
# DrGame E-Commerce Platform — Makefile
# =============================================================================

.PHONY: dev up down build logs ps restart test migrate shell-backend shell-frontend clean

dev:
	docker compose -f docker-compose.dev.yml up -d

up:
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down

build:
	docker compose -f docker-compose.dev.yml build

logs:
	docker compose -f docker-compose.dev.yml logs -f

ps:
	docker compose -f docker-compose.dev.yml ps

restart:
	docker compose -f docker-compose.dev.yml restart

test:
	docker compose -f docker-compose.dev.yml run --rm backend pytest -v

migrate:
	docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head

shell-backend:
	docker compose -f docker-compose.dev.yml exec backend /bin/bash

shell-frontend:
	docker compose -f docker-compose.dev.yml exec frontend /bin/sh

clean:
	docker compose -f docker-compose.dev.yml down -v
