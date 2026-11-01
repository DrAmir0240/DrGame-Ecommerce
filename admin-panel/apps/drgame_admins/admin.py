import bcrypt
from django import forms
from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import (
    ContentAdmin,
    FinanceAdmin,
    SupportAdmin,
    ReportAdmin,
    ReferralAdmin,
    AdminAuditLog,
)


class DepartmentAdminForm(forms.ModelForm):
    raw_password = forms.CharField(
        label="رمز عبور",
        widget=forms.PasswordInput(render_value=False),
        required=False,
        help_text="کلمه عبور جهت ورود ادمین به پنل اختصاصی. (در ثبت ادمین جدید الزامی است؛ در ویرایش خالی بگذارید تا رمز تغییر نکند)",
    )

    class Meta:
        fields = [
            "username",
            "full_name",
            "email",
            "mobile",
            "raw_password",
            "password_hash",
            "access_level",
            "is_active",
            "created_by_admin_id",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "password_hash" in self.fields:
            self.fields["password_hash"].required = False
            self.fields["password_hash"].widget = forms.HiddenInput()
        if not self.instance.pk:
            self.fields["raw_password"].required = True

    def clean(self):
        cleaned_data = super().clean()
        raw_pwd = cleaned_data.get("raw_password")
        if not self.instance.pk and not raw_pwd:
            self.add_error("raw_password", "وارد کردن کلمه عبور برای ایجاد ادمین جدید الزامی است.")
        if raw_pwd:
            salt = bcrypt.gensalt()
            cleaned_data["password_hash"] = bcrypt.hashpw(raw_pwd.encode("utf-8"), salt).decode("utf-8")
        elif self.instance.pk:
            cleaned_data["password_hash"] = self.instance.password_hash
        return cleaned_data


class BaseDepartmentAdminAdmin(BaseERPAdmin):
    form = DepartmentAdminForm
    list_display = ["id", "username", "full_name", "email", "access_level", "is_active", "last_login_at", "created_at"]
    search_fields = ["username", "full_name", "email", "mobile"]
    list_filter = ["access_level", "is_active"]
    fieldsets = [
        ("مشخصات هویتی و پرسنلی", {
            "fields": ["username", "full_name", "email", "mobile"],
        }),
        ("امنیت و احراز هویت", {
            "fields": ["raw_password", "password_hash"],
        }),
        ("سطح دسترسی و وضعیت حساب", {
            "fields": ["access_level", "is_active", "created_by_admin_id"],
        }),
    ]


@admin.register(ContentAdmin)
class ContentAdminAdmin(BaseDepartmentAdminAdmin):
    pass


@admin.register(FinanceAdmin)
class FinanceAdminAdmin(BaseDepartmentAdminAdmin):
    pass


@admin.register(SupportAdmin)
class SupportAdminAdmin(BaseDepartmentAdminAdmin):
    pass


@admin.register(ReportAdmin)
class ReportAdminAdmin(BaseDepartmentAdminAdmin):
    pass


@admin.register(ReferralAdmin)
class ReferralAdminAdmin(BaseDepartmentAdminAdmin):
    pass


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(BaseERPAdmin):
    read_only_ledger = True
    list_display = ["id", "department", "admin_username", "action", "target_entity", "ip_address", "created_at"]
    search_fields = ["admin_username", "action", "target_entity", "ip_address"]
    list_filter = ["department", "action"]
