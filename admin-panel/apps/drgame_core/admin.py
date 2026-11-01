from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import User, UserSession, UserNotification, SiteSetting


@admin.register(User)
class UserAdmin(BaseERPAdmin):
    list_display = ["id", "username", "phone", "email", "full_name", "is_active", "is_verified", "created_at"]
    search_fields = ["username", "phone", "email", "full_name", "referral_code"]
    list_filter = ["is_active", "is_verified", "is_referral_hidden"]


@admin.register(UserSession)
class UserSessionAdmin(BaseERPAdmin):
    list_display = ["id", "user", "device_name", "device_type", "ip_address", "is_active", "last_active_at"]
    search_fields = ["ip_address", "device_name", "user__username"]
    list_filter = ["is_active", "is_primary"]


@admin.register(UserNotification)
class UserNotificationAdmin(BaseERPAdmin):
    list_display = ["id", "user", "title", "notification_type", "is_read", "created_at"]
    search_fields = ["title", "message", "user__username"]
    list_filter = ["is_read", "notification_type"]


@admin.register(SiteSetting)
class SiteSettingAdmin(BaseERPAdmin):
    list_display = ["id", "server_status_text", "server_is_online", "contact_phone", "contact_email", "updated_at"]
