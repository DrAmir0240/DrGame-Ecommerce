"""Tests for Offline-First 3-Tier PlayStation Title ID Resolution Engine."""
import pytest
from app.modules.catalog_sync.title_resolver import (
    resolve_playstation_title_ids,
    normalize_title_slug,
    validate_title_id,
    _load_offline_dataset,
)


def test_normalize_title_slug():
    assert normalize_title_slug("Marvel's Spider-Man: Remastered") == "marvels-spider-man-remastered"
    assert normalize_title_slug("God of War Ragnarök") == "god-of-war-ragnarok"
    assert normalize_title_slug("The Last of Us™ Part I") == "the-last-of-us-part-i"


def test_validate_title_id():
    assert validate_title_id("PPSA01467") is True
    assert validate_title_id("ppsa01467") is True
    assert validate_title_id("CUSA00123") is True
    assert validate_title_id("cusa11995") is True
    assert validate_title_id("INVALID123") is False
    assert validate_title_id(None) is False
    assert validate_title_id("") is False


def test_offline_dataset_loads_properly():
    dataset = _load_offline_dataset()
    assert isinstance(dataset, dict)
    assert len(dataset) >= 30
    assert "marvels-spider-man-remastered" in dataset
    assert dataset["marvels-spider-man-remastered"]["ps5_title_id"] == "PPSA01467"


def test_resolve_by_slug_from_offline_dataset():
    # Exact match on slug
    ps5_id, ps4_id = resolve_playstation_title_ids(
        game_title="Marvel's Spider-Man Remastered",
        slug="marvels-spider-man-remastered",
    )
    assert ps5_id == "PPSA01467"
    assert ps4_id == "CUSA11995"

    # Match by title without slug
    ps5_id, ps4_id = resolve_playstation_title_ids(
        game_title="God of War Ragnarok",
    )
    assert ps5_id == "PPSA08330"
    assert ps4_id == "CUSA34388"


def test_resolve_from_storage_tag_priority():
    # If storage tag is provided, Tier 1 should extract Title ID directly
    ps5_id, ps4_id = resolve_playstation_title_ids(
        game_title="Custom Batman Edition",
        storage_tag="ppsa24342",
    )
    assert ps5_id == "PPSA24342"

    ps5_id, ps4_id = resolve_playstation_title_ids(
        game_title="Custom Game",
        storage_tag="cusa00133",
    )
    assert ps4_id == "CUSA00133"


def test_resolve_unknown_game_returns_none():
    ps5_id, ps4_id = resolve_playstation_title_ids(
        game_title="Totally Unknown Indie Game 2099",
        slug="unknown-indie-game-2099",
    )
    assert ps5_id is None
    assert ps4_id is None
