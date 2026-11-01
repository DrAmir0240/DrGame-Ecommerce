from django.db import models
from core.fields import ERPCharField, ERPTextField, ERPJSONField
from apps.drgame_core.models import User


class Genre(models.Model):
    id = models.AutoField(primary_key=True)
    rawg_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه RAWG")
    name_fa = models.CharField(max_length=100, verbose_name="نام فارسی")
    name_en = ERPCharField(max_length=100, verbose_name="نام انگلیسی", blank=True, null=True)
    slug = models.CharField(max_length=100, verbose_name="اسلاگ")
    icon_name = ERPCharField(max_length=50, verbose_name="آیکون", blank=True, null=True)
    display_order = models.IntegerField(default=0, verbose_name="ترتیب نمایش")
    is_top8 = models.BooleanField(default=False, verbose_name="جزو ۸ برتر")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    image_background = ERPCharField(max_length=500, verbose_name="تصویر پس‌زمینه", blank=True, null=True)

    class Meta:
        managed = False
        db_table = "genres"
        verbose_name = "ژانر / دسته‌بندی بازی"
        verbose_name_plural = "ژانرهای بازی"
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.name_fa


class Game(models.Model):
    id = models.AutoField(primary_key=True)
    rawg_id = models.IntegerField(blank=True, null=True, verbose_name="شناسه RAWG")
    title_fa = models.CharField(max_length=200, verbose_name="عنوان فارسی")
    title_en = ERPCharField(max_length=200, verbose_name="عنوان انگلیسی", blank=True, null=True)
    slug = models.CharField(max_length=200, verbose_name="اسلاگ")
    description_fa = ERPTextField(verbose_name="توضیحات فارسی", blank=True, null=True)
    description_en = ERPTextField(verbose_name="توضیحات انگلیسی", blank=True, null=True)
    storyline_fa = ERPTextField(verbose_name="داستان بازی", blank=True, null=True)
    released = ERPCharField(max_length=20, verbose_name="تاریخ انتشار", blank=True, null=True)
    rating = models.FloatField(default=0.0, verbose_name="امتیاز")
    metacritic = models.IntegerField(blank=True, null=True, verbose_name="نمره متاکریتیک")
    download_size_gb = models.FloatField(default=0.0, verbose_name="حجم کل (گیگابایت)")
    is_two_player = models.BooleanField(default=False, verbose_name="دونفره")
    has_vr = models.BooleanField(default=False, verbose_name="واقعیت مجازی VR")
    platforms = ERPJSONField(blank=True, null=True, verbose_name="پلتفرم‌ها")
    genres = ERPJSONField(blank=True, null=True, verbose_name="ژانرها")
    publisher = ERPCharField(max_length=150, verbose_name="ناشر", blank=True, null=True)
    developer = ERPCharField(max_length=150, verbose_name="توسعه‌دهنده", blank=True, null=True)
    awards = ERPJSONField(blank=True, null=True, verbose_name="جوایز")
    cover_image_url = ERPCharField(max_length=500, verbose_name="کاور", blank=True, null=True)
    banner_image_url = ERPCharField(max_length=500, verbose_name="بنر هدر", blank=True, null=True)
    screenshots = ERPJSONField(blank=True, null=True, verbose_name="اسکرین‌شات‌ها")
    likes_count = models.IntegerField(default=0, verbose_name="پسندها")
    dislikes_count = models.IntegerField(default=0, verbose_name="ناپسندها")
    wishlist_count = models.IntegerField(default=0, verbose_name="علاقه‌مندی‌ها")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        managed = False
        db_table = "games"
        verbose_name = "بازی"
        verbose_name_plural = "کاتالوگ بازی‌ها"
        ordering = ["-id"]

    def __str__(self):
        return self.title_fa or self.title_en or f"Game #{self.id}"


class GameDownloadFile(models.Model):
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    file_type = models.CharField(max_length=20, verbose_name="نوع فایل")
    title = models.CharField(max_length=150, verbose_name="عنوان پارت")
    file_size_gb = models.FloatField(default=0.0, verbose_name="حجم (GB)")
    download_url = models.CharField(max_length=1000, verbose_name="لینک مستقیم")
    allowed_tiers = ERPJSONField(blank=True, null=True, verbose_name="اشتراک‌های مجاز")
    version = ERPCharField(max_length=50, verbose_name="ورژن", blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    class Meta:
        managed = False
        db_table = "game_download_files"
        verbose_name = "فایل دانلود بازی"
        verbose_name_plural = "فایل‌های دانلود بازی‌ها"
        ordering = ["id"]

    def __str__(self):
        return f"{self.game.title_fa} - {self.title}"


class GameDownloadLink(models.Model):
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    part_number = models.IntegerField(default=1, verbose_name="شماره پارت")
    part_name = ERPCharField(max_length=100, verbose_name="نام پارت", blank=True, null=True)
    file_size_gb = models.FloatField(default=0.0, verbose_name="حجم پارت (GB)")
    download_url = models.CharField(max_length=1000, verbose_name="لینک دانلود")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    class Meta:
        managed = False
        db_table = "game_download_links"
        verbose_name = "لینک چندپارتی بازی"
        verbose_name_plural = "لینک‌های چندپارتی بازی‌ها"
        ordering = ["game_id", "part_number"]

    def __str__(self):
        return f"{self.game_id} Part {self.part_number}"


class GameInteraction(models.Model):
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    interaction_type = models.CharField(max_length=20, verbose_name="نوع تعامل")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ")

    class Meta:
        managed = False
        db_table = "game_interactions"
        verbose_name = "تعامل بازی (لایک/علاقه‌مندی)"
        verbose_name_plural = "تعاملات کاربران با بازی‌ها"


class FreeTierAllowedGame(models.Model):
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING, db_column="game_id", verbose_name="بازی")
    is_active = models.BooleanField(default=True, verbose_name="مجاز در پلن رایگان")
    added_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ افزودن")

    class Meta:
        managed = False
        db_table = "free_tier_allowed_games"
        verbose_name = "بازی رایگان مجاز"
        verbose_name_plural = "بازی‌های مجاز اشتراک رایگان"
