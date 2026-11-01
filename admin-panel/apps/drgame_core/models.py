from django.db import models
from core.fields import ERPCharField, ERPTextField, ERPJSONField


class User(models.Model):
    id = models.AutoField(primary_key=True)
    full_name = ERPCharField(max_length=150, verbose_name="نام کامل", blank=True, null=True)
    username = ERPCharField(max_length=50, verbose_name="نام کاربری", blank=True, null=True)
    email = ERPCharField(max_length=255, verbose_name="ایمیل", blank=True, null=True)
    phone = ERPCharField(max_length=20, verbose_name="شماره موبایل", blank=True, null=True)
    password_hash = ERPCharField(max_length=255, verbose_name="هش کلمه عبور", blank=True, null=True)
    console_auth_code = ERPCharField(max_length=10, verbose_name="کد احراز هویت کنسول", blank=True, null=True)
    referral_code = ERPCharField(max_length=12, verbose_name="کد معرف", blank=True, null=True)
    avatar_url = ERPCharField(max_length=500, verbose_name="آواتار", blank=True, null=True)
    hero_banner_url = ERPCharField(max_length=500, verbose_name="بنر هدر", blank=True, null=True)
    is_preset_avatar = models.BooleanField(default=False, verbose_name="آواتار پیش‌فرض")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    is_verified = models.BooleanField(default=False, verbose_name="تایید شده")
    is_referral_hidden = models.BooleanField(default=False, verbose_name="مخفی بودن رفرال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ عضویت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        managed = False
        db_table = "users"
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"
        ordering = ["-id"]

    def __str__(self):
        return self.username or self.phone or f"User #{self.id}"


class UserSession(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    jti = models.CharField(max_length=64, verbose_name="شناسه توکن")
    device_name = ERPCharField(max_length=100, verbose_name="دستگاه", blank=True, null=True)
    device_type = ERPCharField(max_length=30, verbose_name="نوع دستگاه", blank=True, null=True)
    ip_address = ERPCharField(max_length=45, verbose_name="آی‌پی", blank=True, null=True)
    user_agent = ERPCharField(max_length=500, verbose_name="User Agent", blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    is_primary = models.BooleanField(default=False, verbose_name="دستگاه اصلی")
    last_active_at = models.DateTimeField(blank=True, null=True, verbose_name="آخرین فعالیت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ اتصال")

    class Meta:
        managed = False
        db_table = "user_sessions"
        verbose_name = "نشست فعال"
        verbose_name_plural = "نشست‌های فعال کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"Session {self.user_id} - {self.device_name}"


class UserNotification(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    title = models.CharField(max_length=150, verbose_name="عنوان")
    message = models.TextField(verbose_name="متن پیام")
    notification_type = ERPCharField(max_length=50, verbose_name="نوع اعلان", blank=True, null=True)
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارسال")

    class Meta:
        managed = False
        db_table = "user_notifications"
        verbose_name = "اعلان کاربر"
        verbose_name_plural = "اعلان‌های کاربران"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.title} -> {self.user_id}"


class SiteSetting(models.Model):
    id = models.AutoField(primary_key=True)
    header_dns_primary = ERPCharField(max_length=50, verbose_name="DNS اصلی هدر", blank=True, null=True)
    header_dns_secondary = ERPCharField(max_length=50, verbose_name="DNS کمکی هدر", blank=True, null=True)
    server_status_text = ERPCharField(max_length=150, verbose_name="متن وضعیت سرور", blank=True, null=True)
    server_is_online = models.BooleanField(default=True, verbose_name="سرور آنلاین است")
    contact_phone = ERPCharField(max_length=50, verbose_name="تلفن تماس", blank=True, null=True)
    contact_email = ERPCharField(max_length=100, verbose_name="ایمیل تماس", blank=True, null=True)
    contact_address = ERPCharField(max_length=255, verbose_name="آدرس", blank=True, null=True)
    support_working_hours = ERPCharField(max_length=100, verbose_name="ساعات کاری", blank=True, null=True)
    social_telegram = ERPCharField(max_length=150, verbose_name="تلگرام", blank=True, null=True)
    social_instagram = ERPCharField(max_length=150, verbose_name="اینستاگرام", blank=True, null=True)
    social_youtube = ERPCharField(max_length=150, verbose_name="یوتیوب", blank=True, null=True)
    jailbreak_config = ERPJSONField(blank=True, null=True, verbose_name="پیکربندی جیلبریک")
    faq_items = ERPJSONField(blank=True, null=True, verbose_name="سوالات متداول")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        managed = False
        db_table = "site_settings"
        verbose_name = "تنظیمات عمومی سایت"
        verbose_name_plural = "تنظیمات عمومی سایت"

    def __str__(self):
        return f"تنظیمات سایت #{self.id}"
