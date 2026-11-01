from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import BlogCategory, BlogPost, BlogInteraction, HomeBanner


@admin.register(BlogCategory)
class BlogCategoryAdmin(BaseERPAdmin):
    list_display = ["id", "name_fa", "name_en", "slug"]
    search_fields = ["name_fa", "name_en", "slug"]


@admin.register(BlogPost)
class BlogPostAdmin(BaseERPAdmin):
    list_display = ["id", "title_fa", "category", "author_name", "views_count", "likes_count", "is_published", "created_at"]
    search_fields = ["title_fa", "title_en", "slug", "content_fa"]
    list_filter = ["is_published", "category"]


@admin.register(BlogInteraction)
class BlogInteractionAdmin(BaseERPAdmin):
    list_display = ["id", "post", "user", "interaction_type", "created_at"]
    list_filter = ["interaction_type"]


@admin.register(HomeBanner)
class HomeBannerAdmin(BaseERPAdmin):
    list_display = ["id", "title_fa", "position", "badge", "display_order", "is_active", "updated_at"]
    search_fields = ["title_fa", "title_en", "description"]
    list_filter = ["is_active", "position"]
