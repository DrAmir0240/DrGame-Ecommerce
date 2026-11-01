"""Create / refresh the single admin account of the panel from .env."""

from __future__ import annotations

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the superuser defined by DJANGO_ADMIN_USERNAME / DJANGO_ADMIN_PASSWORD."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_ADMIN_USERNAME", "superadmin").strip()
        password = os.environ.get("DJANGO_ADMIN_PASSWORD", "drgame_superadmin_secure_2026")
        email = os.environ.get("DJANGO_ADMIN_EMAIL", "superadmin@drgame.local")

        if not username or not password:
            raise CommandError("DJANGO_ADMIN_USERNAME and DJANGO_ADMIN_PASSWORD must be set in environment.")

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "created" if created else "updated"
        self.stdout.write(
            self.style.SUCCESS(f'✔ superuser "{username}" {action}')
        )
