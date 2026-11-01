from django.db import models
from core.fields import ERPCharField, ERPTextField
from apps.drgame_core.models import User


class SupportTicket(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    user_name = ERPCharField(max_length=128, verbose_name="نام کاربر", blank=True, null=True)
    user_phone = ERPCharField(max_length=32, verbose_name="تلفن", blank=True, null=True)
    subject = models.CharField(max_length=255, verbose_name="موضوع تیکت")
    department = models.CharField(max_length=64, default="general", verbose_name="دپارتمان")
    priority = models.CharField(max_length=32, default="medium", verbose_name="اولویت")
    status = models.CharField(max_length=32, default="open", verbose_name="وضعیت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        managed = False
        db_table = "support_tickets"
        verbose_name = "تیکت پشتیبانی"
        verbose_name_plural = "تیکت‌های پشتیبانی"
        ordering = ["-id"]

    def __str__(self):
        return f"Ticket #{self.id} - {self.subject}"


class SupportTicketMessage(models.Model):
    id = models.AutoField(primary_key=True)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.DO_NOTHING, db_column="ticket_id", verbose_name="تیکت")
    sender_type = models.CharField(max_length=16, verbose_name="نوع فرستنده (user/admin)")
    sender_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه فرستنده")
    sender_name = ERPCharField(max_length=128, verbose_name="نام فرستنده", blank=True, null=True)
    message = models.TextField(verbose_name="متن پیام")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارسال")

    class Meta:
        managed = False
        db_table = "support_ticket_messages"
        verbose_name = "پیام تیکت"
        verbose_name_plural = "پیام‌های تیکت‌ها"
        ordering = ["id"]

    def __str__(self):
        return f"Message #{self.id} on Ticket #{self.ticket_id}"
