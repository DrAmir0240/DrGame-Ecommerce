from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import (
    SubscriptionTier,
    UserSubscription,
    OrderPayment,
    DiscountCode,
    UserDiscount,
    UserWallet,
    UserQuota,
    QuotaConsumptionLog,
    UserDownloadHistory,
)


@admin.register(SubscriptionTier)
class SubscriptionTierAdmin(BaseERPAdmin):
    list_display = ["id", "code", "name_fa", "price_toman", "quota_gb", "speed_limit_mbps", "is_active"]
    search_fields = ["code", "name_fa", "name_en"]
    list_filter = ["is_active"]


@admin.register(UserSubscription)
class UserSubscriptionAdmin(BaseERPAdmin):
    list_display = ["id", "user", "tier_code", "start_date", "end_date", "status"]
    search_fields = ["user__username", "user__phone", "tier_code"]
    list_filter = ["status", "tier_code"]


@admin.register(OrderPayment)
class OrderPaymentAdmin(BaseERPAdmin):
    list_display = ["id", "user", "tier_code", "final_price", "payment_method", "transaction_ref", "status", "created_at"]
    search_fields = ["user__username", "user__phone", "transaction_ref", "discount_code_used"]
    list_filter = ["status", "payment_method"]


@admin.register(DiscountCode)
class DiscountCodeAdmin(BaseERPAdmin):
    list_display = ["id", "code", "discount_percent", "fixed_discount_toman", "used_count", "usage_limit", "is_active", "expires_at"]
    search_fields = ["code"]
    list_filter = ["is_active"]


@admin.register(UserDiscount)
class UserDiscountAdmin(BaseERPAdmin):
    list_display = ["id", "user", "title", "discount_percent", "starts_at", "expires_at", "is_used", "is_active"]
    search_fields = ["user__username", "title"]
    list_filter = ["is_used", "is_active"]


@admin.register(UserWallet)
class UserWalletAdmin(BaseERPAdmin):
    list_display = ["id", "user", "withdrawable_balance_toman", "pending_balance_toman", "total_earned_toman", "total_withdrawn_toman", "updated_at"]
    search_fields = ["user__username", "user__phone"]


@admin.register(UserQuota)
class UserQuotaAdmin(BaseERPAdmin):
    list_display = ["id", "user", "total_quota_gb", "used_quota_gb", "remaining_quota_gb", "updated_at"]
    search_fields = ["user__username", "user__phone"]


@admin.register(QuotaConsumptionLog)
class QuotaConsumptionLogAdmin(BaseERPAdmin):
    list_display = ["id", "user", "game", "gb_deducted", "download_server_id", "created_at"]
    search_fields = ["user__username", "game__title_fa"]


@admin.register(UserDownloadHistory)
class UserDownloadHistoryAdmin(BaseERPAdmin):
    list_display = ["id", "user", "game", "file_title", "file_size_gb", "downloaded_at"]
    search_fields = ["user__username", "game__title_fa", "file_title"]
