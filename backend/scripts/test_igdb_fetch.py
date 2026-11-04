#!/usr/bin/env python3
"""Standalone IGDB Catalog Inspection Script for DrGame.
Fetches games from IGDB v4 using Twitch OAuth2, normalizes fields,
constructs high-res media links, and prints detailed console output without touching DB or Redis.
"""
import sys
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

# Credentials
CLIENT_ID = "755p4548dxlbbe5n6xud3fnw3zjwsd"
CLIENT_SECRET = "6fddqp62amcta340bymo4gjd4w2io0"
TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_BASE_URL = "https://api.igdb.com/v4"

def get_twitch_access_token() -> str:
    """Fetch OAuth2 Bearer token from Twitch."""
    params = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    })
    url = f"{TOKEN_URL}?{params}"
    req = urllib.request.Request(url, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        token = data.get("access_token")
        expires_in = data.get("expires_in", 0)
        print(f"\033[1;32m✔ Twitch OAuth Token acquired successfully! (Expires in: {expires_in}s / ~{expires_in // 86400} days)\033[0m")
        return token

def query_igdb(endpoint: str, query_text: str, token: str) -> list[dict]:
    """Execute APICalypse query against IGDB endpoint."""
    url = f"{IGDB_BASE_URL}/{endpoint}"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Client-ID", CLIENT_ID)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "text/plain")
    req.add_header("Accept", "application/json")
    req.data = query_text.encode("utf-8")

    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

def format_date(timestamp: int | None) -> str:
    if not timestamp:
        return "نامشخص"
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
    except Exception:
        return str(timestamp)

def extract_platforms(platforms: list[dict]) -> tuple[list[str], bool]:
    """Extract PS4, PS5, and detect VR."""
    labels = set()
    has_vr = False
    for p in platforms:
        p_id = p.get("id")
        name = p.get("name", "").lower()
        if p_id == 167 or "playstation 5" in name or "ps5" in name:
            labels.add("PS5")
        if p_id == 48 or "playstation 4" in name or "ps4" in name:
            labels.add("PS4")
        if p_id in (165, 390) or "vr" in name:
            has_vr = True

    if not labels:
        labels = {"PS5", "PS4"}
    return sorted(list(labels)), has_vr

def extract_companies(companies: list[dict]) -> tuple[str, str]:
    """Extract developer and publisher names."""
    dev = "نامشخص"
    pub = "نامشخص"
    for item in companies:
        c_name = item.get("company", {}).get("name")
        if not c_name:
            continue
        if item.get("developer"):
            dev = c_name
        if item.get("publisher"):
            pub = c_name
    return dev, pub

def detect_two_player(game_modes: list[dict]) -> bool:
    """Check if game supports multiplayer / co-op."""
    for m in game_modes:
        name = m.get("name", "").lower()
        if any(keyword in name for keyword in ["co-operative", "multiplayer", "split screen"]):
            return True
    return False

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "recent"
    query_arg = sys.argv[2] if len(sys.argv) > 2 else ""
    extra_arg = sys.argv[3] if len(sys.argv) > 3 else ""

    print("\033[1;36m========================================================================\033[0m")
    print("\033[1;36m    🎮 DrGame - اسکریپت تست و بازبینی دریافت دیتای بازی‌ها از IGDB       \033[0m")
    print("\033[1;36m========================================================================\033[0m\n")

    token = get_twitch_access_token()
    now = int(time.time())

    # Build APICalypse query
    fields = """
        id, name, slug, summary, storyline, first_release_date,
        rating, rating_count, aggregated_rating, aggregated_rating_count, total_rating,
        cover.image_id, cover.url,
        artworks.image_id,
        screenshots.image_id,
        genres.name,
        platforms.id, platforms.name,
        game_modes.name,
        involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
    """

    if mode == "search" and query_arg:
        where_clause = f'search "{query_arg}";'
        full_query = f"fields {fields} {where_clause} limit 5;"
        print(f"🔍 جستجوی ۵ بازی برای عبارت: \033[1;33m'{query_arg}'\033[0m\n")
    elif mode == "top":
        where_clause = "where platforms = (48, 167) & cover != null & rating != null & rating_count > 100;"
        full_query = f"fields {fields} {where_clause} sort rating_count desc; limit 5;"
        print("🏆 دریافت ۵ بازی برتر و پرامتیاز پلی‌استیشن...\n")
    elif mode == "year" and query_arg:
        target_year = int(query_arg)
        start_year = int(datetime(target_year, 1, 1).timestamp())
        end_year = int(datetime(target_year, 12, 31, 23, 59, 59).timestamp())
        where_clause = f"where platforms = (48, 167) & first_release_date >= {start_year} & first_release_date <= {end_year} & cover != null & rating != null & rating_count > 10;"
        full_query = f"fields {fields} {where_clause} sort first_release_date desc; limit 5;"
        print(f"📅 فیلتر بر اساس سال انتشار: \033[1;33mسال {target_year}\033[0m (مرتب‌شده از جدیدترین به قدیمی‌ترین)...\n")
    elif mode == "date" and query_arg and extra_arg:
        start_ts = int(datetime.strptime(query_arg, "%Y-%m-%d").timestamp())
        end_ts = int(datetime.strptime(extra_arg, "%Y-%m-%d").timestamp())
        where_clause = f"where platforms = (48, 167) & first_release_date >= {start_ts} & first_release_date <= {end_ts} & cover != null;"
        full_query = f"fields {fields} {where_clause} sort first_release_date desc; limit 5;"
        print(f"📅 فیلتر در بازه تاریخی مشخص: از \033[1;33m{query_arg}\033[0m تا \033[1;33m{extra_arg}\033[0m...\n")
    else:  # recent
        where_clause = f"where platforms = (48, 167) & cover != null & screenshots != null & first_release_date < {now};"
        full_query = f"fields {fields} {where_clause} sort first_release_date desc; limit 5;"
        print("⚡ دریافت ۵ بازی اخیر و جدید منتشرشده برای پلی‌استیشن (مرتب‌سازی بر اساس تاریخ انتشار)...\n")

    start_time = time.time()
    games = query_igdb("games", full_query, token)
    elapsed = time.time() - start_time

    print(f"\033[1;32m✔ دریافت {len(games)} بازی در {elapsed:.2f} ثانیه!\033[0m\n")

    for idx, g in enumerate(games, start=1):
        source_id = str(g["id"])
        name = g.get("name", "Unknown Title")
        slug = g.get("slug", "")
        summary = g.get("summary") or "خلاصه‌ای ثبت نشده است."
        storyline = g.get("storyline") or "خط داستانی ثبت نشده است."
        release_date = format_date(g.get("first_release_date"))

        # Ratings
        raw_rating = g.get("rating")
        rating_5_scale = round(raw_rating / 20.0, 1) if raw_rating else 0.0
        critic_rating = round(g.get("aggregated_rating") or 0.0)

        # Platforms & Modes
        platforms, has_vr = extract_platforms(g.get("platforms") or [])
        is_two_player = detect_two_player(g.get("game_modes") or [])
        genres = [item["name"] for item in g.get("genres") or [] if "name" in item]
        dev, pub = extract_companies(g.get("involved_companies") or [])

        # Media - Cover
        cover_id = g.get("cover", {}).get("image_id")
        cover_igdb_url = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{cover_id}.jpg" if cover_id else None
        cover_1080p_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{cover_id}.jpg" if cover_id else None
        cover_s3_key = f"games/{source_id}/cover.jpg" if cover_id else None

        # Media - Hero Banner (Artwork)
        artworks = g.get("artworks") or []
        banner_id = artworks[0].get("image_id") if artworks else None
        banner_1080p_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{banner_id}.jpg" if banner_id else cover_1080p_url
        banner_s3_key = f"games/{source_id}/banner.jpg" if banner_id else cover_s3_key

        # Media - Gameplay Screenshots
        raw_screenshots = g.get("screenshots") or []
        screenshot_items = []
        for s_idx, s in enumerate(raw_screenshots[:6], start=1):
            s_id = s.get("image_id")
            if s_id:
                screenshot_items.append({
                    "index": s_idx,
                    "igdb_1080p": f"https://images.igdb.com/igdb/image/upload/t_1080p/{s_id}.jpg",
                    "s3_target_key": f"games/{source_id}/screenshots/{s_idx}.jpg"
                })

        print(f"\033[1;35m┌───────────────────────────────────────────────────────────────────────\033[0m")
        print(f"\033[1;35m│ 🎮 بازی شماره {idx}: \033[1;37m{name}\033[0m")
        print(f"\033[1;35m├───────────────────────────────────────────────────────────────────────\033[0m")
        print(f"│ • \033[1;33mSource ID (شناسه سرورس):\033[0m {source_id}")
        print(f"│ • \033[1;33mSlug:\033[0m {slug}")
        print(f"│ • \033[1;33mتاریخ انتشار:\033[0m {release_date}")
        print(f"│ • \033[1;33mامتیاز کاربری (مقیاس ۵):\033[0m {rating_5_scale} / 5.0 (امتیاز اصلی IGDB: {raw_rating})")
        print(f"│ • \033[1;33mمتاکریتیک (نقد منتقدان):\033[0m {critic_rating if critic_rating > 0 else 'ثبت نشده'}")
        print(f"│ • \033[1;33mپلتفرم‌ها:\033[0m {', '.join(platforms)}")
        print(f"│ • \033[1;33mسبک‌ها (ژانر):\033[0m {', '.join(genres) if genres else 'نامشخص'}")
        print(f"│ • \033[1;33mاستودیو سازنده:\033[0m {dev}  |  \033[1;33mناشر:\033[0m {pub}")
        print(f"│ • \033[1;33mقابلیت دونفره/کواپ:\033[0m {'بله ✔' if is_two_player else 'خیر ✖'}  |  \033[1;33mپشتیبانی واقعیت مجازی (VR):\033[0m {'بله ✔' if has_vr else 'خیر ✖'}")
        print(f"│ • \033[1;33mخلاصه داستان:\033[0m {summary[:120]}...")
        if storyline != "خط داستانی ثبت نشده است.":
            print(f"│ • \033[1;33mخط داستانی:\033[0m {storyline[:120]}...")

        print(f"│")
        print(f"│ 📸 \033[1;36mاطلاعات و لینک‌های چندرسانه‌ای (انواع عکس‌های بازی):\033[0m")
        print(f"│   ├─ \033[1;32mکاور اصلی (Cover Big):\033[0m {cover_igdb_url}")
        print(f"│   │  └─ کیفیت ۱۰۸۰p: {cover_1080p_url}")
        print(f"│   │  └─ کلید ذخیره در S3 لیارا: \033[1;34m{cover_s3_key}\033[0m")
        print(f"│   │")
        print(f"│   ├─ \033[1;32mهیرو بنر / آرت‌ورک اصلی (Banner/Artwork):\033[0m {banner_1080p_url}")
        print(f"│   │  └─ کلید ذخیره در S3 لیارا: \033[1;34m{banner_s3_key}\033[0m")
        print(f"│   │")
        print(f"│   └─ \033[1;32mاسکرین‌شات‌های گیم‌پلی ({len(screenshot_items)} عکس):\033[0m")
        for s in screenshot_items:
            print(f"│      ├─ تصویر {s['index']}: {s['igdb_1080p']}")
            print(f"│      │  └─ کلید در S3 لیارا: \033[1;34m{s['s3_target_key']}\033[0m")
        print(f"\033[1;35m└───────────────────────────────────────────────────────────────────────\033[0m\n")

    print("\033[1;32m✔ تمام جزئیات ۵ بازی دریافت و بدون ثبت در پایگاه داده در کنسول چاپ شد.\033[0m")
    print("\033[1;33mنکته: هیچ پارت دانلودی برای بازی‌ها تولید نشد و فیلدها کاملاً جنریک (source_id) هستند.\033[0m\n")

if __name__ == "__main__":
    main()
