"""Unit tests for the catalog sync narrative and storyline synthesis engine."""
import pytest
from app.modules.catalog_sync.narrative import (
    clean_text,
    is_farsi,
    build_genre_flavor,
    generate_rich_storyline,
    generate_rich_description,
    synthesize_game_narrative,
)


def test_clean_text():
    assert clean_text("  Hello \n\t world!  ") == "Hello world!"
    assert clean_text(None) == ""


def test_is_farsi():
    assert is_farsi("سلام دنیا") is True
    assert is_farsi("Hello world") is False
    assert is_farsi(None) is False


def test_build_genre_flavor():
    world_rpg, trials_rpg = build_genre_flavor(["Role-playing (RPG)"])
    assert "پادشاهی‌های کهن" in world_rpg
    assert "اخلاقی" in trials_rpg

    world_shoot, trials_shoot = build_genre_flavor(["Shooter", "Action"])
    assert "نبرد" in world_shoot
    assert "رگبار آتش" in trials_shoot


def test_generate_rich_storyline_minimum_10_lines():
    """Verify that storyline_fa strictly contains at least 10 non-empty lines."""
    story = generate_rich_storyline(
        title="Test Odyssey",
        translated_plot="یک ماجراجویی شگفت‌انگیز در دل تاریکی.",
        genres=["Role-playing (RPG)", "Adventure"],
        platforms=["PS5", "Xbox"],
        developer="Studio Test",
    )
    non_empty_lines = [l for l in story.split("\n") if l.strip()]
    assert len(non_empty_lines) >= 10, f"Expected >= 10 lines, got {len(non_empty_lines)}"
    assert "Test Odyssey" in story
    assert "روایت" in story
    assert "حماسه" in story


def test_generate_rich_storyline_no_plot_fallback():
    """Verify that when no plot is provided, a rich 10+ line storyline is still generated."""
    story = generate_rich_storyline(
        title="Blank Lore Title",
        translated_plot="",
        genres=["Strategy"],
        platforms=["PS4"],
        developer=None,
    )
    non_empty_lines = [l for l in story.split("\n") if l.strip()]
    assert len(non_empty_lines) >= 10, f"Expected >= 10 lines, got {len(non_empty_lines)}"
    assert "Blank Lore Title" in story


def test_generate_rich_description():
    desc = generate_rich_description(
        title="Epic Warriors",
        translated_summary="یک بازی جذاب اکشن.",
        genres=["Action"],
        platforms=["PS5"],
        developer="FromSoftware",
        publisher="Bandai Namco",
    )
    assert "FromSoftware" in desc
    assert "Bandai Namco" in desc
    assert "PS5" in desc
    assert "Action" in desc


@pytest.mark.asyncio
async def test_synthesize_game_narrative():
    desc_fa, story_fa = await synthesize_game_narrative(
        title="Cyber Knight",
        summary="A thrilling cyberpunk adventure in Neo Tokyo.",
        storyline="In 2099, the mega-corporations rule supreme and rogue hackers fight for freedom.",
        genres=["Action", "Shooter"],
        platforms=["PS5", "Xbox", "Switch"],
        developer="CyberCorp",
        publisher="NeoPub",
    )
    non_empty_lines = [l for l in story_fa.split("\n") if l.strip()]
    assert len(non_empty_lines) >= 10
    assert len(desc_fa) > 100
    assert "Cyber Knight" in story_fa
