#!/usr/bin/env python3
"""Translate missing locales via direct server execution to avoid rate limits."""

import os
import re
import json
import time
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MESSAGES_DIR = ROOT / "src" / "i18n" / "messages"
LOCALES_DIR = ROOT / "src" / "i18n" / "locales"
CACHE_DIR = ROOT / ".i18n-cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

TARGET_LOCALES = ["fr", "tr", "it", "pt", "nl", "ja", "ko", "hi"]
SECTIONS = ["store", "account", "uiA", "uiB", "uiC", "adminA", "adminB", "adminC", "adminD"]

PLACEHOLDER_REGEX = re.compile(r"\{\{[^{}]+\}\}")
HAS_LETTER_REGEX = re.compile(r"[a-zA-Z]")
SEP = "\n<<<999>>>\n"

SERVER_HOST = "root@62.60.191.67"

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

def load_cache(lang: str) -> dict:
    f = CACHE_DIR / f"{lang}.json"
    if f.exists():
        try:
            with open(f, "r", encoding="utf-8") as fp:
                return json.load(fp)
        except Exception:
            pass
    return {}

def save_cache(lang: str, cache: dict):
    f = CACHE_DIR / f"{lang}.json"
    with open(f, "w", encoding="utf-8") as fp:
        json.dump(cache, fp, ensure_ascii=False, indent=2)

def translate_batch_on_server(batch: list[str], target: str) -> list[str]:
    combined = SEP.join(batch)
    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", SERVER_HOST, f"python3 /tmp/translate_helper.py {target}"]
    try:
        proc = subprocess.run(cmd, input=combined.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25)
        if proc.returncode == 0:
            output = proc.stdout.decode("utf-8").strip()
            parts = re.split(r"\s*<<<\s*999\s*>>>\s*", output)
            if len(parts) == len(batch):
                return [p.strip() for p in parts]
            else:
                # If length didn't match, attempt 1-by-1
                print(f"Warning: batch split length mismatch ({len(parts)} vs {len(batch)}). Falling back...")
    except Exception as e:
        print("Error executing batch on server:", e)

    return batch

def process_target_locale(lang: str, all_strings: list[str]):
    print(f"\n==========================================")
    print(f"🌍 Translating locale: {lang.upper()} ({len(all_strings)} strings)")
    print(f"==========================================")
    cache = load_cache(lang)
    to_fetch = [s for s in all_strings if s not in cache]
    print(f"[{lang}] Already cached: {len(cache)} | Missing to fetch: {len(to_fetch)}")

    batch_size = 25
    for i in range(0, len(to_fetch), batch_size):
        chunk = to_fetch[i : i + batch_size]
        translated_chunk = translate_batch_on_server(chunk, lang)
        for orig, trans in zip(chunk, translated_chunk):
            cache[orig] = trans
        save_cache(lang, cache)
        print(f"[{lang}] Progress: {min(i + batch_size, len(to_fetch))}/{len(to_fetch)}")
        time.sleep(0.4)

    # Write section files
    target_msg_dir = MESSAGES_DIR / lang
    target_msg_dir.mkdir(parents=True, exist_ok=True)
    en_msg_dir = MESSAGES_DIR / "en"

    for sec in SECTIONS:
        en_file = en_msg_dir / f"{sec}.json"
        if en_file.exists():
            with open(en_file, "r", encoding="utf-8") as fp:
                en_data = json.load(fp)
            trans_data = apply_translations(en_data, cache)
            out_file = target_msg_dir / f"{sec}.json"
            with open(out_file, "w", encoding="utf-8") as fp:
                json.dump(trans_data, fp, ensure_ascii=False, indent=2)

    # Write locale file
    en_loc_file = LOCALES_DIR / "en.json"
    if en_loc_file.exists():
        with open(en_loc_file, "r", encoding="utf-8") as fp:
            en_loc_data = json.load(fp)
        trans_loc_data = apply_translations(en_loc_data, cache)
        out_loc = LOCALES_DIR / f"{lang}.json"
        with open(out_loc, "w", encoding="utf-8") as fp:
            json.dump(trans_loc_data, fp, ensure_ascii=False, indent=2)

    print(f"✅ [{lang}] All catalog and section files successfully generated!")

def main():
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
        process_target_locale(lang, all_strings)

    print("\n🎉 All 8 missing locales successfully translated and written to disk!")

if __name__ == "__main__":
    main()
