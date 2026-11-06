"""Offline-First 3-Tier PlayStation Title ID Resolution Engine.
Resolves Sony PPSA (PS5) and CUSA (PS4) product codes without external network dependencies.
Supports national intranet operation, storage tag inference, and offline dataset matching.
"""
import os
import re
import json
import logging
import unicodedata
from typing import Optional, Tuple

logger = logging.getLogger("drgame.title_resolver")

DATA_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "playstation_title_ids.json",
)

PPSA_REGEX = re.compile(r"PPSA\d{5}", re.IGNORECASE)
CUSA_REGEX = re.compile(r"CUSA\d{5}", re.IGNORECASE)

_OFFLINE_CACHE: dict = {}


def _load_offline_dataset() -> dict:
    """Load curated offline PlayStation Title IDs dataset into memory."""
    global _OFFLINE_CACHE
    if not _OFFLINE_CACHE and os.path.isfile(DATA_FILE_PATH):
        try:
            with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
                _OFFLINE_CACHE = json.load(f)
            logger.info(f"Loaded {len(_OFFLINE_CACHE)} offline Title ID entries from {DATA_FILE_PATH}")
        except Exception as e:
            logger.error(f"Failed to load offline title IDs dataset: {e}")
    return _OFFLINE_CACHE


def normalize_title_slug(title: str) -> str:
    """Normalize game title to standard matching slug."""
    if not title:
        return ""
    # Strip trademark and special symbols first
    clean = re.sub(r"[™®©'\"’]", "", title)
    # Transliterate unicode characters (ö -> o, etc.)
    text = unicodedata.normalize("NFKD", clean)
    text = text.encode("ascii", "ignore").decode("utf-8")
    clean = text.lower()
    clean = re.sub(r"[:\-_/\\|]+", " ", clean)
    clean = re.sub(r"\s+", "-", clean).strip("-")
    return clean


def validate_title_id(title_id: Optional[str]) -> bool:
    """Validate whether string matches PlayStation Title ID standard format."""
    if not title_id:
        return False
    tid = title_id.strip().upper()
    return bool(PPSA_REGEX.fullmatch(tid) or CUSA_REGEX.fullmatch(tid))


def resolve_playstation_title_ids(
    game_title: str,
    slug: Optional[str] = None,
    storage_tag: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    100% Offline-Resilient Title ID Resolution Engine.
    Tier 1: Inspect storage server tag/content_tag.
    Tier 2: Match against offline JSON dictionary by slug or normalized title.
    Returns: (ps5_title_id, ps4_title_id)
    """
    ps5_id: Optional[str] = None
    ps4_id: Optional[str] = None

    # Tier 1: Storage Tag inspection
    if storage_tag:
        tag_upper = storage_tag.upper().strip()
        m5 = PPSA_REGEX.search(tag_upper)
        if m5:
            ps5_id = m5.group(0).upper()
        m4 = CUSA_REGEX.search(tag_upper)
        if m4:
            ps4_id = m4.group(0).upper()

    # Tier 2: Offline Curated Dataset
    dataset = _load_offline_dataset()
    if dataset and not (ps5_id and ps4_id):
        # 1. Try slug directly
        candidates = []
        if slug:
            candidates.append(slug.lower().strip())
            candidates.append(normalize_title_slug(slug))
        if game_title:
            candidates.append(normalize_title_slug(game_title))

        matched_entry = None
        for candidate in candidates:
            if candidate in dataset:
                matched_entry = dataset[candidate]
                break

        # Fuzzy slug prefix matching if not found (e.g. "marvels-spider-man-remastered" vs "spider-man-remastered")
        if not matched_entry and candidates:
            for cand in candidates:
                for k, v in dataset.items():
                    if cand == k or (len(cand) > 5 and (cand in k or k in cand)):
                        matched_entry = v
                        break
                if matched_entry:
                    break

        if matched_entry:
            if not ps5_id and matched_entry.get("ps5_title_id"):
                ps5_id = matched_entry["ps5_title_id"].upper()
            if not ps4_id and matched_entry.get("ps4_title_id"):
                ps4_id = matched_entry["ps4_title_id"].upper()

    return ps5_id, ps4_id
