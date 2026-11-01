from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import (
    ReferralChain,
    ReferralTreasuryPool,
    SettlementAccount,
    WithdrawalRequest,
    CommissionLedger,
    TreasuryLog,
)


@admin.register(ReferralChain)
class ReferralChainAdmin(BaseERPAdmin):
    list_display = ["id", "user", "referrer", "created_at"]
    search_fields = ["user__username", "referrer__username"]


@admin.register(ReferralTreasuryPool)
class ReferralTreasuryPoolAdmin(BaseERPAdmin):
    list_display = ["id", "balance_toman", "total_collected_toman", "total_distributed_toman", "updated_at"]


@admin.register(SettlementAccount)
class SettlementAccountAdmin(BaseERPAdmin):
    list_display = ["id", "user", "account_type", "bank_name", "sheba_number", "card_number", "is_verified", "is_active"]
    search_fields = ["user__username", "sheba_number", "card_number", "national_code", "phone"]
    list_filter = ["is_verified", "is_active", "account_type"]


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(BaseERPAdmin):
    list_display = ["id", "user", "settlement_account", "amount_toman", "status", "created_at", "processed_at"]
    search_fields = ["user__username", "user__phone"]
    list_filter = ["status"]


@admin.register(CommissionLedger)
class CommissionLedgerAdmin(BaseERPAdmin):
    list_display = ["id", "order_payment", "beneficiary_type", "user", "tier_level", "amount_toman", "created_at"]
    search_fields = ["user__username", "description"]
    list_filter = ["beneficiary_type", "tier_level"]


@admin.register(TreasuryLog)
class TreasuryLogAdmin(BaseERPAdmin):
    list_display = ["id", "action_type", "amount_toman", "order_id", "created_at"]
    search_fields = ["action_type", "description"]
    list_filter = ["action_type"]
