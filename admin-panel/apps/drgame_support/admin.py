from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import SupportTicket, SupportTicketMessage


@admin.register(SupportTicket)
class SupportTicketAdmin(BaseERPAdmin):
    list_display = ["id", "subject", "user", "department", "priority", "status", "created_at"]
    search_fields = ["subject", "user_name", "user_phone", "user__username"]
    list_filter = ["status", "priority", "department"]


@admin.register(SupportTicketMessage)
class SupportTicketMessageAdmin(BaseERPAdmin):
    list_display = ["id", "ticket", "sender_type", "sender_name", "created_at"]
    search_fields = ["message", "sender_name"]
    list_filter = ["sender_type"]
