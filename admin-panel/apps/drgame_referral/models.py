from django.db import models
from core.fields import ERPCharField, ERPTextField
from apps.drgame_core.models import User
from apps.drgame_billing.models import OrderPayment


class ReferralChain(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="chain_as_user", db_column="user_id", verbose_name="کاربر زیرمجموعه")
    referrer = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name="chain_as_referrer", db_column="referrer_id", verbose_name="معرف")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ پیوند")

    class Meta:
        managed = False
        db_table = "referral_chains"
        verbose_name = "زنجیره رفرال"
        verbose_name_plural = "زنجیره‌های رفرال"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user} -> {self.referrer}"


class ReferralTreasuryPool(models.Model):
    id = models.AutoField(primary_key=True)
    balance_toman = models.BigIntegerField(default=0, verbose_name="موجودی خزانه (تومان)")
    total_collected_toman = models.BigIntegerField(default=0, verbose_name="کل ورودی خزانه (تومان)")
    total_distributed_toman = models.BigIntegerField(default=0, verbose_name="کل توزیع‌شده (تومان)")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        managed = False
        db_table = "referral_treasury_pool"
        verbose_name = "استخر خزانه‌داری رفرال"
        verbose_name_plural = "استخر خزانه‌داری رفرال"

    def __str__(self):
        return f"Treasury Balance: {self.balance_toman:,} تومان"


class SettlementAccount(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    account_type = models.CharField(max_length=20, default="BANK_ACCOUNT", verbose_name="نوع حساب")
    sheba_number = ERPCharField(max_length=30, verbose_name="شماره شبا (IBAN)", blank=True, null=True)
    card_number = ERPCharField(max_length=20, verbose_name="شماره کارت", blank=True, null=True)
    account_holder = ERPCharField(max_length=150, verbose_name="نام صاحب حساب", blank=True, null=True)
    bank_name = ERPCharField(max_length=100, verbose_name="نام بانک", blank=True, null=True)
    national_code = ERPCharField(max_length=10, verbose_name="کد ملی", blank=True, null=True)
    phone = ERPCharField(max_length=20, verbose_name="شماره تماس", blank=True, null=True)
    crypto_wallet_address = ERPCharField(max_length=150, verbose_name="آدرس کیف پول تتر/کریپتو", blank=True, null=True)
    crypto_network = ERPCharField(max_length=30, verbose_name="شبکه کریپتو", blank=True, null=True)
    is_verified = models.BooleanField(default=False, verbose_name="تایید شده توسط مدیریت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        managed = False
        db_table = "settlement_accounts"
        verbose_name = "حساب تسویه بانکی/کریپتویی"
        verbose_name_plural = "حساب‌های تسویه کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user} - {self.bank_name or self.account_type}"


class WithdrawalRequest(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر درخواست‌دهنده")
    settlement_account = models.ForeignKey(SettlementAccount, on_delete=models.DO_NOTHING, db_column="settlement_account_id", verbose_name="حساب مقصد")
    amount_toman = models.BigIntegerField(verbose_name="مبلغ تسویه (تومان)")
    status = models.CharField(max_length=20, default="PENDING", verbose_name="وضعیت درخواست")
    admin_receipt_url = ERPCharField(max_length=500, verbose_name="تصویر رسید پرداخت", blank=True, null=True)
    admin_notes = ERPCharField(max_length=500, verbose_name="یادداشت مدیر مالی", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    processed_at = models.DateTimeField(blank=True, null=True, verbose_name="تاریخ بررسی/انجام")

    class Meta:
        managed = False
        db_table = "withdrawal_requests"
        verbose_name = "درخواست تسویه‌حساب مالی"
        verbose_name_plural = "درخواست‌های تسویه‌حساب و واریز"
        ordering = ["-id"]

    def __str__(self):
        return f"Withdrawal #{self.id} - {self.amount_toman:,} تومان ({self.status})"


class CommissionLedger(models.Model):
    id = models.AutoField(primary_key=True)
    order_payment = models.ForeignKey(OrderPayment, on_delete=models.DO_NOTHING, db_column="order_payment_id", verbose_name="سفارش مرتبط")
    beneficiary_type = models.CharField(max_length=20, verbose_name="نوع ذینفع")
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", blank=True, null=True, verbose_name="کاربر گیرنده پورسانت")
    tier_level = models.IntegerField(default=1, verbose_name="سطح معرف (۱ تا ۳)")
    amount_toman = models.BigIntegerField(verbose_name="مبلغ پورسانت (تومان)")
    description = ERPCharField(max_length=255, verbose_name="شرح", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        managed = False
        db_table = "commission_ledgers"
        verbose_name = "دفتر پورسانت رفرال"
        verbose_name_plural = "دفتر پورسانت‌های رفرال"
        ordering = ["-id"]


class TreasuryLog(models.Model):
    id = models.AutoField(primary_key=True)
    amount_toman = models.BigIntegerField(verbose_name="مبلغ (تومان)")
    action_type = models.CharField(max_length=50, verbose_name="نوع عملیات خزانه‌داری")
    order_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه سفارش")
    description = ERPCharField(max_length=255, verbose_name="شرح", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ")

    class Meta:
        managed = False
        db_table = "treasury_logs"
        verbose_name = "لاگ خزانه‌داری"
        verbose_name_plural = "لاگ‌های خزانه‌داری"
        ordering = ["-id"]
