#!/usr/bin/env python3
"""Build authentic message catalogs for missing locales (fr, tr, it, pt, nl, ja, ko, hi)
using MyMemory translation with local caching, placeholder safety, and concurrency control.
"""

import os
import re
import json
import asyncio
import urllib.parse
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parents[2]
MESSAGES_DIR = ROOT / "src" / "i18n" / "messages"
LOCALES_DIR = ROOT / "src" / "i18n" / "locales"
CACHE_DIR = ROOT / ".i18n-cache"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

TARGET_LOCALES = ["fr", "tr", "it", "pt", "nl", "ja", "ko", "hi"]
SECTIONS = ["store", "account", "uiA", "uiB", "uiC", "adminA", "adminB", "adminC", "adminD"]

PLACEHOLDER_REGEX = re.compile(r"\{\{[^{}]+\}\}")
HAS_LETTER_REGEX = re.compile(r"[a-zA-Z]")

def load_cache(lang: str) -> dict:
    cache_file = CACHE_DIR / f"{lang}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_cache(lang: str, cache: dict):
    cache_file = CACHE_DIR / f"{lang}.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

async def translate_text(client: httpx.AsyncClient, text: str, target: str, sem: asyncio.Semaphore) -> str:
    if not text or not HAS_LETTER_REGEX.search(text):
        return text

    # Handle placeholders by tokenizing if needed or checking post-translation
    source_placeholders = sorted(PLACEHOLDER_REGEX.findall(text))
    
    encoded_q = urllib.parse.quote(text)
    url = f"https://api.mymemory.translated.net/get?q={encoded_q}&langpair=en|{target}"

    async with sem:
        for attempt in range(4):
            try:
                resp = await client.get(url, timeout=6.0)
                if resp.status_code == 200:
                    data = resp.json()
                    trans = data.get("responseData", {}).get("translatedText")
                    if trans and trans.strip():
                        # Verify placeholders
                        trans_placeholders = sorted(PLACEHOLDER_REGEX.findall(trans))
                        if source_placeholders and trans_placeholders != source_placeholders:
                            # If placeholders got corrupted, restore source
                            return text
                        return trans.strip()
                elif resp.status_code == 429:
                    await asyncio.sleep(1.5 * (attempt + 1))
            except Exception:
                await asyncio.sleep(0.5 * (attempt + 1))
    
    return text

def collect_strings(obj, collector: set):
    if isinstance(obj, dict):
        for v in obj.values():
            collect_strings(v, collector)
    elif isinstance(obj, str) and HAS_LETTER_REGEX.search(obj):
        collector.add(obj)

def apply_translations(obj, cache: dict):
    if isinstance(obj, dict):
        return {k: apply_translations(v, cache) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [apply_translations(x, cache) for x in obj]
    elif isinstance(obj, str):
        return cache.get(obj, obj)
    return obj

async def process_locale(lang: str, all_strings: list[str]):
    print(f"\n--- Processing locale: {lang} ({len(all_strings)} strings) ---")
    cache = load_cache(lang)
    to_fetch = [s for s in all_strings if s not in cache]
    print(f"[{lang}] Already cached: {len(cache)} | To fetch: {len(to_fetch)}")

    sem = asyncio.Semaphore(12)  # max 12 concurrent requests
    async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}) as client:
        chunk_size = 50
        for i in range(0, len(to_fetch), chunk_size):
            chunk = to_fetch[i : i + chunk_size]
            tasks = [translate_text(client, s, lang, sem) for s in chunk]
            results = await asyncio.gather(*tasks)
            for s, r in zip(chunk, results):
                cache[s] = r
            save_cache(lang, cache)
            print(f"[{lang}] Progress: {min(i + chunk_size, len(to_fetch))}/{len(to_fetch)}")
            await asyncio.sleep(0.3)

    # Now write the files
    loc_file = LOCALES_DIR / f"{lang}.json"
    en_loc_file = LOCALES_DIR / "en.json"
    if en_loc_file.exists():
        with open(en_loc_file, "r", encoding="utf-8") as f:
            en_data = json.load(f)
        trans_data = apply_translations(en_data, cache)
        with open(loc_file, "w", encoding="utf-8") as f:
            json.dump(trans_data, f, ensure_ascii=False, indent=2)
        print(f"[{lang}] Wrote {loc_file}")

    target_msg_dir = MESSAGES_DIR / lang
    target_msg_dir.mkdir(parents=True, exist_ok=True)
    en_msg_dir = MESSAGES_DIR / "en"

    for sec in SECTIONS:
        en_sec_file = en_msg_dir / f"{sec}.json"
        if en_sec_file.exists():
            with open(en_sec_file, "r", encoding="utf-8") as f:
                en_sec_data = json.load(f)
            trans_sec_data = apply_translations(en_sec_data, cache)
            out_file = target_msg_dir / f"{sec}.json"
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(trans_sec_data, f, ensure_ascii=False, indent=2)

    print(f"[{lang}] All message section files successfully updated!")

async def main():
    # 1. Collect all strings from en
    all_strings_set = set()
    en_loc_file = LOCALES_DIR / "en.json"
    if en_loc_file.exists():
        with open(en_loc_file, "r", encoding="utf-8") as f:
            collect_strings(json.load(f), all_strings_set)

    en_msg_dir = MESSAGES_DIR / "en"
    for sec in SECTIONS:
        en_sec_file = en_msg_dir / f"{sec}.json"
        if en_sec_file.exists():
            with open(en_sec_file, "r", encoding="utf-8") as f:
                collect_strings(json.load(f), all_strings_set)

    all_strings = sorted(list(all_strings_set))
    print(f"Total unique strings in EN catalogs: {len(all_strings)}")

    for lang in TARGET_LOCALES:
        await process_locale(lang, all_strings)

if __name__ == "__main__":
    asyncio.run(main())
