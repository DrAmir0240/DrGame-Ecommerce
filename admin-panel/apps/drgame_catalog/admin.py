from django.contrib import admin
from unfold.admin import ModelAdmin
from core.admin_base import BaseERPAdmin
from .models import Genre, Game, GameDownloadFile, GameDownloadLink, GameInteraction, FreeTierAllowedGame


@admin.register(Genre)
class GenreAdmin(BaseERPAdmin):
    list_display = ["id", "name_fa", "name_en", "slug", "display_order", "is_top8", "is_active"]
    search_fields = ["name_fa", "name_en", "slug"]
    list_filter = ["is_active", "is_top8"]


@admin.register(Game)
class GameAdmin(BaseERPAdmin):
    list_display = ["id", "title_fa", "title_en", "rating", "metacritic", "download_size_gb", "likes_count", "is_active"]
    search_fields = ["title_fa", "title_en", "slug", "publisher", "developer"]
    list_filter = ["is_active", "is_two_player", "has_vr"]


@admin.register(GameDownloadFile)
class GameDownloadFileAdmin(BaseERPAdmin):
    list_display = ["id", "game", "file_type", "title", "file_size_gb", "is_active", "created_at"]
    search_fields = ["title", "game__title_fa", "download_url"]
    list_filter = ["file_type", "is_active"]


@admin.register(GameDownloadLink)
class GameDownloadLinkAdmin(BaseERPAdmin):
    list_display = ["id", "game", "part_number", "part_name", "file_size_gb", "is_active"]
    search_fields = ["part_name", "game__title_fa"]
    list_filter = ["is_active"]


@admin.register(GameInteraction)
class GameInteractionAdmin(BaseERPAdmin):
    list_display = ["id", "game", "user", "interaction_type", "created_at"]
    list_filter = ["interaction_type"]


@admin.register(FreeTierAllowedGame)
class FreeTierAllowedGameAdmin(BaseERPAdmin):
    list_display = ["id", "game", "is_active", "added_at"]
    list_filter = ["is_active"]
