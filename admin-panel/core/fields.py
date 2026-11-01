"""Custom model fields used by the mirrored DrGame models."""

from __future__ import annotations

from django.db import models


class ERPJSONField(models.JSONField):
    """A JSONField that transparently handles python dicts/lists or json strings."""

    def from_db_value(self, value, expression, connection):
        if value is None or isinstance(value, (dict, list, int, float, bool)):
            return value
        return super().from_db_value(value, expression, connection)


class NullIfEmptyMixin:
    """Store an empty text value as SQL NULL."""

    def get_db_prep_save(self, value, connection):
        if value == "":
            return None
        return super().get_db_prep_save(value, connection)


class ERPCharField(NullIfEmptyMixin, models.CharField):
    """A CharField for nullable varchar columns."""


class ERPTextField(NullIfEmptyMixin, models.TextField):
    """A TextField for nullable text columns."""
