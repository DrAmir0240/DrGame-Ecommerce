"""Shared admin behaviour for every mirrored DrGame model."""

from __future__ import annotations

from django.contrib import admin
from django.db.models import Model
from unfold.admin import ModelAdmin


class BaseERPAdmin(ModelAdmin):
    """Common configuration for mirrored (unmanaged) models.

    Models are mirrors of FastAPI/SQLAlchemy tables, so Django never touches structure.
    """

    read_only_ledger = False
    list_per_page = 50
    list_max_show_all = 200
    save_on_top = True
    save_as = False
    show_full_result_count = False
    preserve_filters = True
    empty_value_display = "—"

    def has_add_permission(self, request) -> bool:
        if self.read_only_ledger:
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None) -> bool:
        if self.read_only_ledger:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None) -> bool:
        if self.read_only_ledger:
            return False
        return super().has_delete_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj is not None:
            pk = obj._meta.pk
            if pk and pk.name not in readonly:
                readonly.append(pk.name)
        return readonly


def register_all(app_module, admin_site=None) -> list[type]:
    """Register every model of an app with BaseERPAdmin."""
    site = admin_site or admin.site
    registered: list[type] = []
    for attribute in vars(app_module).values():
        if (
            isinstance(attribute, type)
            and issubclass(attribute, Model)
            and attribute is not Model
            and attribute._meta.managed is False
            and not attribute._meta.auto_created
        ):
            if attribute in site._registry:
                continue
            site.register(attribute, BaseERPAdmin)
            registered.append(attribute)
    return registered
