from django.db import models
from core.fields import ERPCharField, ERPTextField, ERPJSONField
from apps.drgame_core.models import User


class BlogCategory(models.Model):
    id = models.AutoField(primary_key=True)
    name_fa = models.CharField(max_length=100, verbose_name="نام فارسی")
    name_en = ERPCharField(max_length=100, verbose_name="نام انگلیسی", blank=True, null=True)
    slug = models.CharField(max_length=100, verbose_name="اسلاگ")

    class Meta:
        managed = False
        db_table = "blog_categories"
        verbose_name = "دسته‌بندی مقالات"
        verbose_name_plural = "دسته‌بندی‌های وبلاگ"
        ordering = ["id"]

    def __str__(self):
        return self.name_fa


class BlogPost(models.Model):
    id = models.AutoField(primary_key=True)
    title_fa = models.CharField(max_length=250, verbose_name="عنوان فارسی")
    title_en = ERPCharField(max_length=250, verbose_name="عنوان انگلیسی", blank=True, null=True)
    slug = models.CharField(max_length=250, verbose_name="اسلاگ")
    category = models.ForeignKey(BlogCategory, on_delete=models.DO_NOTHING, db_column="category_id", verbose_name="دسته‌بندی")
    content_fa = ERPTextField(verbose_name="متن فارسی", blank=True, null=True)
    content_en = ERPTextField(verbose_name="متن انگلیسی", blank=True, null=True)
    cover_image_url = ERPCharField(max_length=500, verbose_name="تصویر شاخص", blank=True, null=True)
    author_name = ERPCharField(max_length=100, verbose_name="نویسنده", blank=True, null=True)
    reading_time_min = models.IntegerField(default=5, verbose_name="زمان مطالعه (دقیقه)")
    likes_count = models.IntegerField(default=0, verbose_name="پسندها")
    dislikes_count = models.IntegerField(default=0, verbose_name="ناپسندها")
    views_count = models.IntegerField(default=0, verbose_name="بازدیدها")
    is_published = models.BooleanField(default=True, verbose_name="منتشر شده")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ انتشار")

    class Meta:
        managed = False
        db_table = "blog_posts"
        verbose_name = "پست وبلاگ"
        verbose_name_plural = "مقالات و وبلاگ"
        ordering = ["-id"]

    def __str__(self):
        return self.title_fa


class BlogInteraction(models.Model):
    id = models.AutoField(primary_key=True)
    post = models.ForeignKey(BlogPost, on_delete=models.DO_NOTHING, db_column="post_id", verbose_name="مقاله")
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column="user_id", verbose_name="کاربر")
    interaction_type = models.CharField(max_length=20, verbose_name="نوع تعامل")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ")

    class Meta:
        managed = False
        db_table = "blog_interactions"
        verbose_name = "تعامل مقاله"
        verbose_name_plural = "تعاملات مقالات"


class HomeBanner(models.Model):
    id = models.AutoField(primary_key=True)
    position = models.IntegerField(default=1, verbose_name="موقعیت")
    badge = ERPCharField(max_length=100, verbose_name="بج / برچسب", blank=True, null=True)
    title_fa = models.CharField(max_length=200, verbose_name="عنوان فارسی")
    title_en = ERPCharField(max_length=200, verbose_name="عنوان انگلیسی", blank=True, null=True)
    description = ERPTextField(verbose_name="توضیحات", blank=True, null=True)
    backdrop_url = ERPCharField(max_length=1000, verbose_name="تصویر بک‌دراپ", blank=True, null=True)
    link_href = ERPCharField(max_length=500, verbose_name="لینک هدف", blank=True, null=True)
    cta_text = ERPCharField(max_length=100, verbose_name="متن دکمه CTA", blank=True, null=True)
    platforms = ERPJSONField(blank=True, null=True, verbose_name="پلتفرم‌ها")
    display_order = models.IntegerField(default=0, verbose_name="ترتیب نمایش")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین ویرایش")

    class Meta:
        managed = False
        db_table = "home_banners"
        verbose_name = "بنر صفحه اصلی"
        verbose_name_plural = "بنرهای صفحه اصلی (Hero Banners)"
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.title_fa
