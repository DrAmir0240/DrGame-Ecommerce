import bcrypt
from django.db import models
from core.fields import ERPCharField, ERPJSONField


class BaseDepartmentAdmin(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=60, unique=True, verbose_name="نام کاربری")
    email = models.CharField(max_length=255, unique=True, verbose_name="ایمیل", blank=True, default="")
    mobile = ERPCharField(max_length=20, verbose_name="موبایل", blank=True, null=True)
    password_hash = models.CharField(max_length=255, verbose_name="رمز عبور / هش امنیتی")
    full_name = models.CharField(max_length=100, verbose_name="نام و نام خانوادگی", blank=True, default="")
    access_level = models.CharField(
        max_length=20,
        default="read_only",
        choices=[("read_only", "فقط مشاهده (Read-Only)"), ("full_crud", "دسترسی کامل (Full CRUD)")],
        verbose_name="سطح دسترسی",
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    last_login_at = models.DateTimeField(blank=True, null=True, verbose_name="آخرین ورود")
    created_by_admin_id = models.IntegerField(blank=True, null=True, verbose_name="ایجاد شده توسط ادمین")

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Auto-fill full_name if empty so PostgreSQL NOT NULL constraint is never violated
        if not self.full_name:
            self.full_name = self.username
        # Auto-fill email if empty so PostgreSQL NOT NULL constraint is never violated
        if not self.email:
            dept_slug = self._meta.db_table.split("_")[0]
            self.email = f"{self.username}@{dept_slug}.drgame.local"
        # Auto-hash password with Bcrypt if raw plain-text is provided
        if self.password_hash and not (
            self.password_hash.startswith("$2b$")
            or self.password_hash.startswith("$2a$")
            or self.password_hash.startswith("$2y$")
        ):
            salt = bcrypt.gensalt()
            self.password_hash = bcrypt.hashpw(self.password_hash.encode("utf-8"), salt).decode("utf-8")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_access_level_display()})"


class ContentAdmin(BaseDepartmentAdmin):
    class Meta:
        managed = False
        db_table = "content_admins"
        verbose_name = "ادمین محتوا و بلاگ"
        verbose_name_plural = "پرسنل دپارتمان محتوا (Content Admins)"
        ordering = ["-id"]


class FinanceAdmin(BaseDepartmentAdmin):
    class Meta:
        managed = False
        db_table = "finance_admins"
        verbose_name = "ادمین امور مالی و اشتراک"
        verbose_name_plural = "پرسنل دپارتمان مالی (Finance Admins)"
        ordering = ["-id"]


class SupportAdmin(BaseDepartmentAdmin):
    class Meta:
        managed = False
        db_table = "support_admins"
        verbose_name = "ادمین پشتیبانی و کاربران"
        verbose_name_plural = "پرسنل دپارتمان پشتیبانی (Support Admins)"
        ordering = ["-id"]


class ReportAdmin(BaseDepartmentAdmin):
    class Meta:
        managed = False
        db_table = "report_admins"
        verbose_name = "ادمین گزارش‌گیری و نظارت"
        verbose_name_plural = "پرسنل دپارتمان گزارش‌گیری (Report Admins)"
        ordering = ["-id"]


class ReferralAdmin(BaseDepartmentAdmin):
    class Meta:
        managed = False
        db_table = "referral_admins"
        verbose_name = "ادمین بازاریابی و رفرال"
        verbose_name_plural = "پرسنل دپارتمان رفرال (Referral Admins)"
        ordering = ["-id"]


class AdminAuditLog(models.Model):
    id = models.AutoField(primary_key=True)
    department = models.CharField(max_length=30, verbose_name="دپارتمان")
    admin_id = models.IntegerField(verbose_name="شناسه ادمین")
    admin_username = models.CharField(max_length=60, verbose_name="نام کاربری ادمین")
    action = models.CharField(max_length=50, verbose_name="عنوان عملیات")
    target_entity = ERPCharField(max_length=100, verbose_name="موجودیت هدف", blank=True, null=True)
    ip_address = ERPCharField(max_length=45, verbose_name="آی‌پی", blank=True, null=True)
    user_agent = ERPCharField(max_length=255, verbose_name="User Agent", blank=True, null=True)
    details = ERPJSONField(blank=True, null=True, verbose_name="جزییات پی‌لود / تغییرات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ثبت لاگ")

    class Meta:
        managed = False
        db_table = "admin_audit_logs"
        verbose_name = "لاگ امنیتی عملیات ادمین"
        verbose_name_plural = "لاگ‌های امنیتی ادمین‌ها (Audit Logs)"
        ordering = ["-id"]

    def __str__(self):
        return f"[{self.department}] {self.admin_username} -> {self.action}"
