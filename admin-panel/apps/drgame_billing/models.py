from django.db import models
from core.fields import ERPCharField, ERPTextField, ERPJSONField
from apps.drgame_core.models import User
from apps.drgame_catalog.models import Game


class SubscriptionTier(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=30, unique=True, verbose_name="کد پلن")
    name_fa = models.CharField(max_length=100, verbose_name="نام فارسی")
    name_en = ERPCharField(max_length=100, verbose_name="نام انگلیسی", blank=True, null=True)
    price_toman = models.IntegerField(default=0, verbose_name="قیمت (تومان)")
    price_usd = models.FloatField(default=0.0, verbose_name="قیمت (دلار)")
    quota_gb = models.IntegerField(default=0, verbose_name="سهمیه حجم (GB)")
    speed_limit_mbps = models.IntegerField(default=0, verbose_name="سقف سرعت (Mbps)")
    allowed_platforms = ERPJSONField(blank=True, null=True, verbose_name="پلتفرم‌های مجاز")
    allow_data = models.BooleanField(default=True, verbose_name="مجاز دیتای بازی")
    allow_cheat = models.BooleanField(default=False, verbose_name="مجاز چیت")
    allow_dlc = models.BooleanField(default=False, verbose_name="مجاز DLC")
    allow_subtitles = models.BooleanField(default=False, verbose_name="مجاز زیرنویس")
    allow_dubbing = models.BooleanField(default=False, verbose_name="مجاز دوبله")
    allow_themes = models.BooleanField(default=False, verbose_name="مجاز تم")
    durations = ERPJSONField(blank=True, null=True, verbose_name="مدت‌های قابل انتخاب")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        managed = False
        db_table = "subscription_tiers"
        verbose_name = "پلن اشتراک"
        verbose_name_plural = "پلن‌های اشتراک"
        ordering = ["id"]

    def __str__(self):
        return f"{self.name_fa} ({self.code})"


class UserSubscription(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    tier_code = models.CharField(max_length=30, verbose_name="کد پلن")
    start_date = models.DateTimeField(verbose_name="تاریخ شروع")
    end_date = models.DateTimeField(verbose_name="تاریخ انقضا")
    status = models.CharField(max_length=20, default="ACTIVE", verbose_name="وضعیت")
    payment_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه پرداخت")

    class Meta:
        managed = False
        db_table = "user_subscriptions"
        verbose_name = "اشتراک کاربر"
        verbose_name_plural = "اشتراک‌های کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user} - {self.tier_code} ({self.status})"


class OrderPayment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    tier_code = models.CharField(max_length=30, verbose_name="کد پلن")
    original_price = models.IntegerField(verbose_name="قیمت پایه (تومان)")
    discount_amount = models.IntegerField(default=0, verbose_name="مبلغ تخفیف (تومان)")
    final_price = models.IntegerField(verbose_name="مبلغ پرداختی نهایی (تومان)")
    discount_code_used = ERPCharField(max_length=50, verbose_name="کد تخفیف مصرفی", blank=True, null=True)
    payment_method = ERPCharField(max_length=30, verbose_name="درگاه / روش پرداخت", blank=True, null=True)
    transaction_ref = ERPCharField(max_length=100, verbose_name="شماره پیگیری / مرجع", blank=True, null=True)
    status = models.CharField(max_length=20, default="PENDING", verbose_name="وضعیت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ تراکنش")

    class Meta:
        managed = False
        db_table = "order_payments"
        verbose_name = "سفارش و تراکنش بانکی"
        verbose_name_plural = "سفارش‌ها و تراکنش‌های بانکی"
        ordering = ["-id"]

    def __str__(self):
        return f"Order #{self.id} - {self.user} ({self.final_price:,} تومان)"


class DiscountCode(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, verbose_name="کد تخفیف")
    discount_percent = models.IntegerField(default=0, verbose_name="درصد تخفیف")
    max_discount_toman = models.IntegerField(default=0, verbose_name="سقف تخفیف درصدی (تومان)")
    fixed_discount_toman = models.IntegerField(default=0, verbose_name="تخفیف ثابت (تومان)")
    usage_limit = models.IntegerField(default=1, verbose_name="سقف استفاده")
    used_count = models.IntegerField(default=0, verbose_name="تعداد استفاده شده")
    expires_at = models.DateTimeField(blank=True, null=True, verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        managed = False
        db_table = "discount_codes"
        verbose_name = "کد تخفیف"
        verbose_name_plural = "کدهای تخفیف"
        ordering = ["-id"]

    def __str__(self):
        return self.code


class UserWallet(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    withdrawable_balance_toman = models.BigIntegerField(default=0, verbose_name="موجودی قابل برداشت (تومان)")
    pending_balance_toman = models.BigIntegerField(default=0, verbose_name="موجودی معلق تسویه هفتگی (تومان)")
    total_earned_toman = models.BigIntegerField(default=0, verbose_name="مجموع درآمد رفرال (تومان)")
    total_withdrawn_toman = models.BigIntegerField(default=0, verbose_name="مجموع تسویه‌شده (تومان)")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        managed = False
        db_table = "user_wallets"
        verbose_name = "کیف پول کاربر"
        verbose_name_plural = "کیف پول‌های کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"Wallet {self.user} ({self.withdrawable_balance_toman:,} تومان)"


class UserDiscount(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    title = models.CharField(max_length=150, verbose_name="عنوان تخفیف")
    discount_percent = models.IntegerField(default=0, verbose_name="درصد تخفیف")
    max_discount_toman = models.IntegerField(blank=True, null=True, verbose_name="سقف تخفیف (تومان)")
    applicable_tier_codes = ERPJSONField(blank=True, null=True, verbose_name="پلن‌های مجاز")
    starts_at = models.DateTimeField(verbose_name="شروع اعتبار")
    expires_at = models.DateTimeField(verbose_name="پایان اعتبار")
    is_used = models.BooleanField(default=False, verbose_name="مصرف شده")
    used_at = models.DateTimeField(blank=True, null=True, verbose_name="تاریخ مصرف")
    order_payment_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه سفارش مرتبط")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_by_admin_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه ادمین ایجادکننده")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    class Meta:
        managed = False
        db_table = "user_discounts"
        verbose_name = "تخفیف کاربرمحور"
        verbose_name_plural = "تخفیف‌های کاربرمحور"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user} - {self.discount_percent}% ({self.title})"


class UserQuota(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    total_quota_gb = models.FloatField(default=0.0, verbose_name="سهمیه کل (GB)")
    used_quota_gb = models.FloatField(default=0.0, verbose_name="مصرف شده (GB)")
    remaining_quota_gb = models.FloatField(default=0.0, verbose_name="باقیمانده (GB)")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین تغییر")

    class Meta:
        managed = False
        db_table = "user_quotas"
        verbose_name = "سهمیه حجم کاربر"
        verbose_name_plural = "سهمیه‌های حجم کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.user} - {self.remaining_quota_gb} GB remaining"


class QuotaConsumptionLog(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    bytes_downloaded = models.BigIntegerField(default=0, verbose_name="بایت دانلود شده")
    gb_deducted = models.FloatField(default=0.0, verbose_name="حجم کسر شده (GB)")
    download_server_id = ERPCharField(max_length=100, verbose_name="شناسه سرور دانلود", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ مصرف")

    class Meta:
        managed = False
        db_table = "quota_consumption_logs"
        verbose_name = "لاگ مصرف حجم"
        verbose_name_plural = "لاگ‌های مصرف حجم"
        ordering = ["-id"]


class UserDownloadHistory(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    file_id = models.IntegerField(verbose_name="شناسه فایل")
    file_type = models.CharField(max_length=20, verbose_name="نوع فایل")
    file_title = models.CharField(max_length=150, verbose_name="عنوان فایل")
    file_size_gb = models.FloatField(default=0.0, verbose_name="حجم (GB)")
    downloaded_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ شروع دانلود")

    class Meta:
        managed = False
        db_table = "user_download_history"
        verbose_name = "تاریخچه دانلود کاربر"
        verbose_name_plural = "تاریخچه دانلودهای کاربران"
        ordering = ["-id"]
