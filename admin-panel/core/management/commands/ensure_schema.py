"""Create the PostgreSQL schema that hosts Django's own bookkeeping tables."""

from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = (
        "Create the `django_admin` schema if it does not exist. Django's own "
        "tables live there, while DrGame tables stay untouched in `public`."
    )

    def handle(self, *args, **options):
        schema = getattr(settings, "DB_SCHEMA", "django_admin")
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
        self.stdout.write(
            self.style.SUCCESS(f'✔ schema "{schema}" is ready')
        )
