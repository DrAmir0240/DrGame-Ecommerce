"""Platform Database Seeder Script for DrGame (Dual-Mode: Domestic & International).

Populates the platform database with realistic, high-fidelity customer accounts,
multi-level referral trees, active and past subscriptions, payment transactions, wallet commissions,
settlement accounts, payout requests, download history, support tickets, notifications, and device telemetry.

Modes:
- domestic: Realistic Persian gamer accounts, Iranian bank accounts (Saman/Mellat), Toman payments, Persian tickets.
- international: Realistic International gamer accounts (Alex Turner, Sarah Connor, etc.), Crypto USDT/PayPal, USD payments, English tickets.

Rules:
- Does NOT add or alter admins.
- Does NOT add or alter game catalog entries (uses existing catalog games).
- Customer phones strictly follow 09000000001 to 09000000020.
- Fully idempotent: can be executed repeatedly without duplication or errors.
"""

import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from sqlalchemy import select, delete, func
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password

from app.modules.users.models import User
from app.modules.users.notification_models import UserNotification
from app.modules.wallet.models import (
    UserWallet,
    ReferralChain,
    CommissionLedger,
    SettlementAccount,
    WithdrawalRequest,
    SettlementBatch,
)
from app.modules.subscriptions.models import (
    SubscriptionTier,
    UserSubscription,
    OrderPayment,
    DiscountCode,
    UserDiscount,
)
from app.modules.news.models import BlogCategory, BlogPost
from app.modules.quota.models import UserQuota, QuotaConsumptionLog
from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
from app.modules.dpop.models import RegisteredDevice, DeviceStorageReport

# -----------------------------------------------------------------------------
# 20 Realistic Domestic (Persian) Gamer Profiles
# -----------------------------------------------------------------------------
USER_PROFILES_DOMESTIC = [
    {
        "index": 1,
        "phone": "09000000001",
        "username": "amir_gamer",
        "full_name": "امیرحسین محمدی",
        "email": "amir.mohammadi@gmail.com",
        "console_auth_code": "DG10001",
        "referral_code": "DRG0001",
        "avatar_url": "/avatars/avatar-1.png",
        "hero_banner_url": "/banners/banner-1.jpg",
        "tier": "gold",
        "used_gb": 345.5,
        "role_desc": "سفیر ارشد و گیمر حرفه‌ای پلی‌استیشن",
    },
    {
        "index": 2,
        "phone": "09000000002",
        "username": "sara_playz",
        "full_name": "سارا علیزاده",
        "email": "sara.alizadeh@yahoo.com",
        "console_auth_code": "DG10002",
        "referral_code": "DRG0002",
        "avatar_url": "/avatars/avatar-2.png",
        "hero_banner_url": "/banners/banner-2.jpg",
        "tier": "gold",
        "used_gb": 420.0,
        "role_desc": "استریمر و لیدر کامیونیتی بازی‌های داستانی",
    },
    {
        "index": 3,
        "phone": "09000000003",
        "username": "ali_rezaei",
        "full_name": "علی رضایی",
        "email": "ali.rezaei.ps@gmail.com",
        "console_auth_code": "DG10003",
        "referral_code": "DRG0003",
        "avatar_url": "/avatars/avatar-3.png",
        "hero_banner_url": "/banners/banner-3.jpg",
        "tier": "gold",
        "used_gb": 580.2,
        "role_desc": "تستر بازی‌های جیلبریک و پچ‌های فارسی",
    },
    {
        "index": 4,
        "phone": "09000000004",
        "username": "reza_karimi",
        "full_name": "رضا کریمی",
        "email": "reza.karimi@gmail.com",
        "console_auth_code": "DG10004",
        "referral_code": "DRG0004",
        "avatar_url": "/avatars/avatar-4.png",
        "hero_banner_url": "/banners/banner-4.jpg",
        "tier": "silver",
        "used_gb": 210.0,
        "role_desc": "گیمر اکشن و طرفدار مارول",
    },
    {
        "index": 5,
        "phone": "09000000005",
        "username": "mahdi_ps5",
        "full_name": "مهدی احمدی",
        "email": "mahdi.ahmadi@gmail.com",
        "console_auth_code": "DG10005",
        "referral_code": "DRG0005",
        "avatar_url": "/avatars/avatar-5.png",
        "hero_banner_url": "/banners/banner-5.jpg",
        "tier": "silver",
        "used_gb": 185.0,
        "role_desc": "طرفدار سرسخت بازی‌های سولز و فرام‌سافتور",
    },
    {
        "index": 6,
        "phone": "09000000006",
        "username": "fatemeh_m",
        "full_name": "فاطمه مرادی",
        "email": "fatemeh.moradi@yahoo.com",
        "console_auth_code": "DG10006",
        "referral_code": "DRG0006",
        "avatar_url": "/avatars/avatar-6.png",
        "hero_banner_url": "/banners/banner-6.jpg",
        "tier": "silver",
        "used_gb": 195.4,
        "role_desc": "گیمر شوتر تاکتیکال و مسابقه‌ای",
    },
    {
        "index": 7,
        "phone": "09000000007",
        "username": "hossein_kazemi",
        "full_name": "حسین کاظمی",
        "email": "hossein.kazemi@gmail.com",
        "console_auth_code": "DG10007",
        "referral_code": "DRG0007",
        "avatar_url": "/avatars/avatar-7.png",
        "hero_banner_url": "/banners/banner-7.jpg",
        "tier": "silver",
        "used_gb": 220.0,
        "role_desc": "پلیر بازی‌های دونفره محلی (Co-op)",
    },
    {
        "index": 8,
        "phone": "09000000008",
        "username": "kian_akbari",
        "full_name": "کیان اکبری",
        "email": "kian.akbari@gmail.com",
        "console_auth_code": "DG10008",
        "referral_code": "DRG0008",
        "avatar_url": "/avatars/avatar-8.png",
        "hero_banner_url": "/banners/banner-8.jpg",
        "tier": "bronze",
        "used_gb": 95.0,
        "role_desc": "علاقه‌مند بازی‌های کلاسیک و رترو PS4",
    },
    {
        "index": 9,
        "phone": "09000000009",
        "username": "neda_taghavi",
        "full_name": "ندا تقوی",
        "email": "neda.taghavi@gmail.com",
        "console_auth_code": "DG10009",
        "referral_code": "DRG0009",
        "avatar_url": "/avatars/avatar-9.png",
        "hero_banner_url": "/banners/banner-9.jpg",
        "tier": "bronze",
        "used_gb": 110.5,
        "role_desc": "کژوال گیمر و طرفدار بازی‌های پازل",
    },
    {
        "index": 10,
        "phone": "09000000010",
        "username": "armin_ebrahimi",
        "full_name": "آرمین ابراهیمی",
        "email": "armin.ebrahimi@gmail.com",
        "console_auth_code": "DG10010",
        "referral_code": "DRG0010",
        "avatar_url": "/avatars/avatar-10.png",
        "hero_banner_url": "/banners/banner-10.jpg",
        "tier": "bronze",
        "used_gb": 80.0,
        "role_desc": "پلیر فیفا و شبیه‌سازهای ورزشی",
    },
    {
        "index": 11,
        "phone": "09000000011",
        "username": "pouya_rostami",
        "full_name": "پویا رستمی",
        "email": "pouya.rostami@gmail.com",
        "console_auth_code": "DG10011",
        "referral_code": "DRG0011",
        "avatar_url": "/avatars/avatar-11.png",
        "hero_banner_url": "/banners/banner-11.jpg",
        "tier": "gold",
        "used_gb": 390.0,
        "role_desc": "کاربر فعال هدست واقعیت مجازی PS VR2",
    },
    {
        "index": 12,
        "phone": "09000000012",
        "username": "maryam_shojaei",
        "full_name": "مریم شجاعی",
        "email": "maryam.shojaei@yahoo.com",
        "console_auth_code": "DG10012",
        "referral_code": "DRG0012",
        "avatar_url": "/avatars/avatar-12.png",
        "hero_banner_url": "/banners/banner-12.jpg",
        "tier": "silver",
        "used_gb": 170.0,
        "role_desc": "گیمر عناوین ماجراجویی تعاملی",
    },
    {
        "index": 13,
        "phone": "09000000013",
        "username": "mehran_ghasemi",
        "full_name": "مهران قاسمی",
        "email": "mehran.ghasemi@gmail.com",
        "console_auth_code": "DG10013",
        "referral_code": "DRG0013",
        "avatar_url": "/avatars/avatar-13.png",
        "hero_banner_url": "/banners/banner-13.jpg",
        "tier": "gold",
        "used_gb": 520.0,
        "role_desc": "لیدر کلن و شکارچی تروفی‌های پلاتینیوم",
    },
    {
        "index": 14,
        "phone": "09000000014",
        "username": "elham_s",
        "full_name": "الهام صالحی",
        "email": "elham.salehi@gmail.com",
        "console_auth_code": "DG10014",
        "referral_code": "DRG0014",
        "avatar_url": "/avatars/avatar-14.png",
        "hero_banner_url": "/banners/banner-14.jpg",
        "tier": "bronze",
        "used_gb": 110.0,
        "role_desc": "پلیر بازی‌های مستقل و هنری (Indie)",
    },
    {
        "index": 15,
        "phone": "09000000015",
        "username": "danial_f",
        "full_name": "دانیال فرهمند",
        "email": "danial.farahmand@gmail.com",
        "console_auth_code": "DG10015",
        "referral_code": "DRG0015",
        "avatar_url": "/avatars/avatar-15.png",
        "hero_banner_url": "/banners/banner-15.jpg",
        "tier": "gold",
        "used_gb": 460.0,
        "role_desc": "کاربر ویژه پکیج دوبله و زیرنویس فارسی",
    },
    {
        "index": 16,
        "phone": "09000000016",
        "username": "zahra_kiani",
        "full_name": "زهرا کیانی",
        "email": "zahra.kiani@gmail.com",
        "console_auth_code": "DG10016",
        "referral_code": "DRG0016",
        "avatar_url": "/avatars/avatar-16.png",
        "hero_banner_url": "/banners/banner-16.jpg",
        "tier": "silver",
        "used_gb": 185.0,
        "role_desc": "گیمر عناوین ورزشی و استراتژیک",
    },
    {
        "index": 17,
        "phone": "09000000017",
        "username": "erfan_sadeghi",
        "full_name": "عرفان صادقی",
        "email": "erfan.sadeghi@gmail.com",
        "console_auth_code": "DG10017",
        "referral_code": "DRG0017",
        "avatar_url": "/avatars/avatar-17.png",
        "hero_banner_url": "/banners/banner-17.jpg",
        "tier": "bronze",
        "used_gb": 80.0,
        "role_desc": "کاربر فعال بخش تیکت‌ها و تست دانلود",
    },
    {
        "index": 18,
        "phone": "09000000018",
        "username": "mohaddeseh_b",
        "full_name": "محدثه باقری",
        "email": "mohaddeseh.bagheri@gmail.com",
        "console_auth_code": "DG10018",
        "referral_code": "DRG0018",
        "avatar_url": "/avatars/avatar-18.png",
        "hero_banner_url": "/banners/banner-18.jpg",
        "tier": "silver",
        "used_gb": 165.5,
        "role_desc": "پلیر عناوین آرکید و پلتفرمر",
    },
    {
        "index": 19,
        "phone": "09000000019",
        "username": "sina_jafari",
        "full_name": "سینا جعفری",
        "email": "sina.jafari@gmail.com",
        "console_auth_code": "DG10019",
        "referral_code": "DRG0019",
        "avatar_url": "/avatars/avatar-19.png",
        "hero_banner_url": "/banners/banner-19.jpg",
        "tier": "free",
        "used_gb": 0.0,
        "role_desc": "کاربر تازه ملحق‌شده (اشتراک دمو رایگان)",
    },
    {
        "index": 20,
        "phone": "09000000020",
        "username": "bita_mousavi",
        "full_name": "بیتا موسوی",
        "email": "bita.mousavi@gmail.com",
        "console_auth_code": "DG10020",
        "referral_code": "DRG0020",
        "avatar_url": "/avatars/avatar-20.png",
        "hero_banner_url": "/banners/banner-20.jpg",
        "tier": "free",
        "used_gb": 0.0,
        "role_desc": "عضو جدید معرفی شده از طریق شبکه رفرال",
    },
]

# -----------------------------------------------------------------------------
# 20 Realistic International Gamer Profiles
# -----------------------------------------------------------------------------
USER_PROFILES_INTL = [
    {
        "index": 1,
        "phone": "09000000001",
        "username": "alex_turner",
        "full_name": "Alex Turner",
        "email": "alex.turner@gmail.com",
        "console_auth_code": "DG10001",
        "referral_code": "DRG0001",
        "avatar_url": "/avatars/avatar-1.png",
        "hero_banner_url": "/banners/banner-1.jpg",
        "tier": "gold",
        "used_gb": 345.5,
        "role_desc": "Senior PlayStation Ambassador & Pro Gamer",
    },
    {
        "index": 2,
        "phone": "09000000002",
        "username": "sarah_connor",
        "full_name": "Sarah Connor",
        "email": "sarah.connor@yahoo.com",
        "console_auth_code": "DG10002",
        "referral_code": "DRG0002",
        "avatar_url": "/avatars/avatar-2.png",
        "hero_banner_url": "/banners/banner-2.jpg",
        "tier": "gold",
        "used_gb": 420.0,
        "role_desc": "Game Streamer & Narrative Community Lead",
    },
    {
        "index": 3,
        "phone": "09000000003",
        "username": "liam_davis",
        "full_name": "Liam Davis",
        "email": "liam.davis.ps@gmail.com",
        "console_auth_code": "DG10003",
        "referral_code": "DRG0003",
        "avatar_url": "/avatars/avatar-3.png",
        "hero_banner_url": "/banners/banner-3.jpg",
        "tier": "gold",
        "used_gb": 580.2,
        "role_desc": "PlayStation Modder & Jailbreak Tester",
    },
    {
        "index": 4,
        "phone": "09000000004",
        "username": "elena_vance",
        "full_name": "Elena Vance",
        "email": "elena.vance@gmail.com",
        "console_auth_code": "DG10004",
        "referral_code": "DRG0004",
        "avatar_url": "/avatars/avatar-4.png",
        "hero_banner_url": "/banners/banner-4.jpg",
        "tier": "silver",
        "used_gb": 210.0,
        "role_desc": "Action RPG & Sci-Fi Enthusiast",
    },
    {
        "index": 5,
        "phone": "09000000005",
        "username": "kenji_sato",
        "full_name": "Kenji Sato",
        "email": "kenji.sato@gmail.com",
        "console_auth_code": "DG10005",
        "referral_code": "DRG0005",
        "avatar_url": "/avatars/avatar-5.png",
        "hero_banner_url": "/banners/banner-5.jpg",
        "tier": "silver",
        "used_gb": 185.0,
        "role_desc": "Souls-like & FromSoftware Fan",
    },
    {
        "index": 6,
        "phone": "09000000006",
        "username": "lucas_silva",
        "full_name": "Lucas Silva",
        "email": "lucas.silva@hotmail.com",
        "console_auth_code": "DG10006",
        "referral_code": "DRG0006",
        "avatar_url": "/avatars/avatar-6.png",
        "hero_banner_url": "/banners/banner-6.jpg",
        "tier": "silver",
        "used_gb": 195.4,
        "role_desc": "Racing & Co-op Specialist",
    },
    {
        "index": 7,
        "phone": "09000000007",
        "username": "emma_watson",
        "full_name": "Emma Watson",
        "email": "emma.watson@gmail.com",
        "console_auth_code": "DG10007",
        "referral_code": "DRG0007",
        "avatar_url": "/avatars/avatar-7.png",
        "hero_banner_url": "/banners/banner-7.jpg",
        "tier": "silver",
        "used_gb": 220.0,
        "role_desc": "Co-op Adventure Gamer",
    },
    {
        "index": 8,
        "phone": "09000000008",
        "username": "david_kim",
        "full_name": "David Kim",
        "email": "david.kim@gmail.com",
        "console_auth_code": "DG10008",
        "referral_code": "DRG0008",
        "avatar_url": "/avatars/avatar-8.png",
        "hero_banner_url": "/banners/banner-8.jpg",
        "tier": "bronze",
        "used_gb": 95.0,
        "role_desc": "PS4 Retro & Classics Player",
    },
    {
        "index": 9,
        "phone": "09000000009",
        "username": "charlotte_b",
        "full_name": "Charlotte Brown",
        "email": "charlotte.b@yahoo.com",
        "console_auth_code": "DG10009",
        "referral_code": "DRG0009",
        "avatar_url": "/avatars/avatar-9.png",
        "hero_banner_url": "/banners/banner-9.jpg",
        "tier": "bronze",
        "used_gb": 110.5,
        "role_desc": "Casual Gamer & Indie Fan",
    },
    {
        "index": 10,
        "phone": "09000000010",
        "username": "oliver_smith",
        "full_name": "Oliver Smith",
        "email": "oliver.smith@gmail.com",
        "console_auth_code": "DG10010",
        "referral_code": "DRG0010",
        "avatar_url": "/avatars/avatar-10.png",
        "hero_banner_url": "/banners/banner-10.jpg",
        "tier": "bronze",
        "used_gb": 80.0,
        "role_desc": "Sports & Simulation Player",
    },
    {
        "index": 11,
        "phone": "09000000011",
        "username": "sophia_muller",
        "full_name": "Sophia Müller",
        "email": "sophia.muller@gmail.com",
        "console_auth_code": "DG10011",
        "referral_code": "DRG0011",
        "avatar_url": "/avatars/avatar-11.png",
        "hero_banner_url": "/banners/banner-11.jpg",
        "tier": "gold",
        "used_gb": 390.0,
        "role_desc": "PlayStation VR & Simulation Fan",
    },
    {
        "index": 12,
        "phone": "09000000012",
        "username": "mateo_garcia",
        "full_name": "Mateo Garcia",
        "email": "mateo.garcia@gmail.com",
        "console_auth_code": "DG10012",
        "referral_code": "DRG0012",
        "avatar_url": "/avatars/avatar-12.png",
        "hero_banner_url": "/banners/banner-12.jpg",
        "tier": "silver",
        "used_gb": 170.0,
        "role_desc": "Action & Platformer Player",
    },
    {
        "index": 13,
        "phone": "09000000013",
        "username": "mia_larsson",
        "full_name": "Mia Larsson",
        "email": "mia.larsson@gmail.com",
        "console_auth_code": "DG10013",
        "referral_code": "DRG0013",
        "avatar_url": "/avatars/avatar-13.png",
        "hero_banner_url": "/banners/banner-13.jpg",
        "tier": "gold",
        "used_gb": 520.0,
        "role_desc": "Community Moderator & Trophy Hunter",
    },
    {
        "index": 14,
        "phone": "09000000014",
        "username": "chloe_dubois",
        "full_name": "Chloé Dubois",
        "email": "chloe.dubois@gmail.com",
        "console_auth_code": "DG10014",
        "referral_code": "DRG0014",
        "avatar_url": "/avatars/avatar-14.png",
        "hero_banner_url": "/banners/banner-14.jpg",
        "tier": "bronze",
        "used_gb": 110.0,
        "role_desc": "Indie & Narrative Player",
    },
    {
        "index": 15,
        "phone": "09000000015",
        "username": "daniel_frost",
        "full_name": "Daniel Frost",
        "email": "daniel.frost@gmail.com",
        "console_auth_code": "DG10015",
        "referral_code": "DRG0015",
        "avatar_url": "/avatars/avatar-15.png",
        "hero_banner_url": "/banners/banner-15.jpg",
        "tier": "gold",
        "used_gb": 460.0,
        "role_desc": "VIP Subscriber & High-Speed Downloader",
    },
    {
        "index": 16,
        "phone": "09000000016",
        "username": "zoe_kane",
        "full_name": "Zoe Kane",
        "email": "zoe.kane@gmail.com",
        "console_auth_code": "DG10016",
        "referral_code": "DRG0016",
        "avatar_url": "/avatars/avatar-16.png",
        "hero_banner_url": "/banners/banner-16.jpg",
        "tier": "silver",
        "used_gb": 185.0,
        "role_desc": "Sports & Strategy Gamer",
    },
    {
        "index": 17,
        "phone": "09000000017",
        "username": "ethan_sanders",
        "full_name": "Ethan Sanders",
        "email": "ethan.sanders@gmail.com",
        "console_auth_code": "DG10017",
        "referral_code": "DRG0017",
        "avatar_url": "/avatars/avatar-17.png",
        "hero_banner_url": "/banners/banner-17.jpg",
        "tier": "bronze",
        "used_gb": 80.0,
        "role_desc": "Active Downloader & Beta Tester",
    },
    {
        "index": 18,
        "phone": "09000000018",
        "username": "maya_baker",
        "full_name": "Maya Baker",
        "email": "maya.baker@gmail.com",
        "console_auth_code": "DG10018",
        "referral_code": "DRG0018",
        "avatar_url": "/avatars/avatar-18.png",
        "hero_banner_url": "/banners/banner-18.jpg",
        "tier": "silver",
        "used_gb": 165.5,
        "role_desc": "Arcade & Platformer Enthusiast",
    },
    {
        "index": 19,
        "phone": "09000000019",
        "username": "noah_jenkins",
        "full_name": "Noah Jenkins",
        "email": "noah.jenkins@gmail.com",
        "console_auth_code": "DG10019",
        "referral_code": "DRG0019",
        "avatar_url": "/avatars/avatar-19.png",
        "hero_banner_url": "/banners/banner-19.jpg",
        "tier": "free",
        "used_gb": 0.0,
        "role_desc": "New Member (Free Trial Tier)",
    },
    {
        "index": 20,
        "phone": "09000000020",
        "username": "bella_moore",
        "full_name": "Bella Moore",
        "email": "bella.moore@gmail.com",
        "console_auth_code": "DG10020",
        "referral_code": "DRG0020",
        "avatar_url": "/avatars/avatar-20.png",
        "hero_banner_url": "/banners/banner-20.jpg",
        "tier": "free",
        "used_gb": 0.0,
        "role_desc": "Referred Community Member",
    },
]

# -----------------------------------------------------------------------------
# Referral Hierarchy Mapping (User index -> Referrer User index)
# -----------------------------------------------------------------------------
REFERRAL_TREE = {
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 3,
    7: 3,
    8: 4,
    9: 4,
    10: 5,
    11: 1,
    12: 6,
    13: 2,
    14: 7,
    15: 3,
    16: 8,
    17: 9,
    18: 10,
    19: 11,
    20: 12,
}

# Tier Quota and Pricing Specs
TIER_SPECS = {
    "gold": (3000000, 45.0, 2200.0),
    "silver": (1500000, 22.0, 1000.0),
    "bronze": (700000, 10.0, 500.0),
    "free": (0, 0.0, 5.0),
}


async def seed_tiers_and_blogs(session, mode: str):
    """Seed subscription tiers and initial blog categories/posts."""
    from app.modules.subscriptions.services import DEFAULT_TIERS
    from app.modules.news.services import INITIAL_CATEGORIES, INITIAL_POSTS

    print(f"\n[0/11] Seeding Subscription Tiers & Blog Content for {mode.upper()} mode...")

    # 1. Tiers
    for t_data in DEFAULT_TIERS:
        existing = await session.scalar(select(SubscriptionTier).where(SubscriptionTier.code == t_data["code"]))
        if not existing:
            t_copy = dict(t_data)
            if mode == "international":
                t_copy["name_fa"] = t_copy["name_en"]
            tier = SubscriptionTier(**t_copy)
            session.add(tier)
            print(f"  + Added Tier: {tier.code} ({tier.name_en}) - ${tier.price_usd}")

    # 2. Blog Categories
    cat_map = {}
    for cat_data in INITIAL_CATEGORIES:
        existing_cat = await session.scalar(select(BlogCategory).where(BlogCategory.slug == cat_data["slug"]))
        if not existing_cat:
            cat = BlogCategory(**cat_data)
            session.add(cat)
            await session.flush()
            cat_map[cat.slug] = cat.id
            print(f"  + Added Blog Category: {cat.name_en} ({cat.slug})")
        else:
            cat_map[existing_cat.slug] = existing_cat.id

    # 3. Blog Posts
    for p in INITIAL_POSTS:
        existing_post = await session.scalar(select(BlogPost).where(BlogPost.slug == p["slug"]))
        if not existing_post:
            cat_id = cat_map.get(p["category_slug"], 1)
            content_fa = p.get("content_fa", "")
            content_en = p.get("content_fa", "") if mode == "international" else content_fa

            post = BlogPost(
                title_fa=p["title_en"] if mode == "international" else p["title_fa"],
                title_en=p["title_en"],
                slug=p["slug"],
                category_id=cat_id,
                reading_time_min=p["reading_time_min"],
                cover_image_url=p["cover_image_url"],
                content_fa=content_en if mode == "international" else content_fa,
                content_en=content_en,
                author_name="DrGame Team" if mode == "international" else "تیم تخصصی دکتر گیم",
                likes_count=18,
                dislikes_count=0,
                views_count=145,
                is_published=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=20),
            )
            session.add(post)
            print(f"  + Added Blog Post: {post.title_en}")

    await session.commit()


async def seed_data(mode: str = "domestic"):
    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password("User@123456")
    is_intl = mode == "international"

    profiles = USER_PROFILES_INTL if is_intl else USER_PROFILES_DOMESTIC

    print("=================================================================")
    print(f"🚀 Starting DrGame Platform Seeder [{mode.upper()} MODE]...")
    print("=================================================================")

    async with AsyncSessionLocal() as session:
        # Step 0: Base tiers & blog
        await seed_tiers_and_blogs(session, mode)

        # ---------------------------------------------------------------------
        # 1. Seed or Update 20 Customers / Users
        # ---------------------------------------------------------------------
        print(f"\n[1/11] Seeding 20 Customer Users (09000000001 -> 09000000020) [{mode}]...")
        user_map: dict[int, User] = {}

        for prof in profiles:
            stmt = select(User).where(User.phone == prof["phone"])
            res = await session.execute(stmt)
            existing_user = res.scalar_one_or_none()

            if not existing_user:
                u_stmt = select(User).where(User.username == prof["username"])
                u_res = await session.execute(u_stmt)
                existing_user = u_res.scalar_one_or_none()

            if not existing_user:
                new_user = User(
                    phone=prof["phone"],
                    username=prof["username"],
                    full_name=prof["full_name"],
                    email=prof["email"],
                    password_hash=hashed_pwd,
                    console_auth_code=prof["console_auth_code"],
                    referral_code=prof["referral_code"],
                    avatar_url=prof["avatar_url"],
                    hero_banner_url=prof["hero_banner_url"],
                    is_preset_avatar=True,
                    is_active=True,
                    is_verified=True,
                    is_referral_hidden=False,
                    created_at=now - timedelta(days=45 - prof["index"]),
                )
                session.add(new_user)
                await session.flush()
                user_map[prof["index"]] = new_user
                print(f"  + Created User: {new_user.full_name} ({new_user.phone}) - ID: {new_user.id}")
            else:
                existing_user.full_name = prof["full_name"]
                existing_user.username = prof["username"]
                existing_user.email = prof["email"]
                existing_user.password_hash = hashed_pwd
                existing_user.console_auth_code = prof["console_auth_code"]
                existing_user.referral_code = prof["referral_code"]
                existing_user.avatar_url = prof["avatar_url"]
                existing_user.hero_banner_url = prof["hero_banner_url"]
                existing_user.is_active = True
                existing_user.is_verified = True
                user_map[prof["index"]] = existing_user
                print(f"  * Synced User: {existing_user.full_name} ({existing_user.phone}) - ID: {existing_user.id}")

        await session.commit()

        # ---------------------------------------------------------------------
        # 2. Seed Multi-level Referral Tree (referral_chains)
        # ---------------------------------------------------------------------
        print("\n[2/11] Seeding Referral Chains Tree...")
        for child_idx, parent_idx in REFERRAL_TREE.items():
            child_user = user_map[child_idx]
            parent_user = user_map[parent_idx]

            chain_stmt = select(ReferralChain).where(ReferralChain.user_id == child_user.id)
            res = await session.execute(chain_stmt)
            chain = res.scalar_one_or_none()

            if not chain:
                chain = ReferralChain(
                    user_id=child_user.id,
                    referrer_id=parent_user.id,
                    created_at=child_user.created_at + timedelta(minutes=5),
                )
                session.add(chain)
                print(f"  + Referral: {child_user.username} invited by {parent_user.username}")
            else:
                chain.referrer_id = parent_user.id

        await session.commit()

        # ---------------------------------------------------------------------
        # 3. Seed Subscriptions & Quotas
        # ---------------------------------------------------------------------
        print("\n[3/11] Seeding User Subscriptions and Storage Quotas...")
        for prof in profiles:
            user = user_map[prof["index"]]
            tier_code = prof["tier"]
            price_toman, price_usd, total_quota = TIER_SPECS[tier_code]
            used_quota = min(prof["used_gb"], total_quota)
            rem_quota = max(0.0, total_quota - used_quota)

            q_stmt = select(UserQuota).where(UserQuota.user_id == user.id)
            res = await session.execute(q_stmt)
            quota = res.scalar_one_or_none()

            if not quota:
                session.add(UserQuota(
                    user_id=user.id,
                    total_quota_gb=total_quota,
                    used_quota_gb=used_quota,
                    remaining_quota_gb=rem_quota,
                    updated_at=now,
                ))
            else:
                quota.total_quota_gb = total_quota
                quota.used_quota_gb = used_quota
                quota.remaining_quota_gb = rem_quota
                quota.updated_at = now

            if tier_code != "free":
                sub_stmt = select(UserSubscription).where(
                    UserSubscription.user_id == user.id,
                    UserSubscription.status == "active",
                )
                res = await session.execute(sub_stmt)
                existing_sub = res.scalar_one_or_none()

                if not existing_sub:
                    session.add(UserSubscription(
                        user_id=user.id,
                        tier_code=tier_code,
                        start_date=now - timedelta(days=15),
                        end_date=now + timedelta(days=15),
                        status="active",
                    ))

        await session.commit()

        # ---------------------------------------------------------------------
        # 4. Seed Wallets & Payments & Commissions
        # ---------------------------------------------------------------------
        print("\n[4/11] Seeding Wallets, Order Payments & Referral Commissions...")
        wallets = {}
        for prof in profiles:
            user = user_map[prof["index"]]
            w_stmt = select(UserWallet).where(UserWallet.user_id == user.id)
            res = await session.execute(w_stmt)
            wallet = res.scalar_one_or_none()
            if not wallet:
                wallet = UserWallet(
                    user_id=user.id,
                    balance_toman=0,
                    withdrawable_balance_toman=0,
                    updated_at=now,
                )
                session.add(wallet)
                await session.flush()
            wallets[prof["index"]] = wallet

        # Order payments
        paid_specs = [
            (2, "gold", 3000000, 45.0, 30),
            (3, "gold", 3000000, 45.0, 28),
            (4, "silver", 1500000, 22.0, 25),
            (5, "silver", 1500000, 22.0, 20),
            (6, "silver", 1500000, 22.0, 18),
            (7, "silver", 1500000, 22.0, 15),
            (8, "bronze", 700000, 10.0, 12),
            (9, "bronze", 700000, 10.0, 10),
            (10, "bronze", 700000, 10.0, 8),
            (11, "gold", 3000000, 45.0, 6),
            (12, "silver", 1500000, 22.0, 5),
            (13, "gold", 3000000, 45.0, 4),
            (14, "bronze", 700000, 10.0, 3),
            (15, "gold", 3000000, 45.0, 2),
            (16, "silver", 1500000, 22.0, 1),
        ]

        payment_records = []
        for u_idx, t_code, p_toman, p_usd, days_ago in paid_specs:
            user = user_map[u_idx]
            pay_stmt = select(OrderPayment).where(
                OrderPayment.user_id == user.id,
                OrderPayment.tier_code == t_code,
            )
            res = await session.execute(pay_stmt)
            existing_pay = res.scalar_one_or_none()

            pay_amount = p_usd if is_intl else p_toman
            pay_curr = "USD" if is_intl else "IRT"

            if not existing_pay:
                pay = OrderPayment(
                    user_id=user.id,
                    tier_code=t_code,
                    amount_toman=p_toman,
                    currency=pay_curr,
                    tracking_code=f"PAY-{10000 + u_idx}-{int(now.timestamp()) % 100000}",
                    gateway="stripe" if is_intl else "zibal",
                    status="completed",
                    payment_type="subscription",
                    created_at=now - timedelta(days=days_ago),
                    paid_at=now - timedelta(days=days_ago),
                )
                session.add(pay)
                await session.flush()
                payment_records.append((u_idx, pay))
            else:
                payment_records.append((u_idx, existing_pay))

        await session.commit()

        # Commissions
        for buyer_idx, pay in payment_records:
            curr_child = buyer_idx
            tier_level = 1
            rate_map = {1: 0.10, 2: 0.05, 3: 0.025}

            while curr_child in REFERRAL_TREE and tier_level <= 3:
                parent_idx = REFERRAL_TREE[curr_child]
                beneficiary = user_map[parent_idx]
                beneficiary_wallet = wallets[parent_idx]

                rate = rate_map[tier_level]
                commission_amt = int(pay.amount_toman * rate)

                c_stmt = select(CommissionLedger).where(
                    CommissionLedger.beneficiary_id == beneficiary.id,
                    CommissionLedger.order_payment_id == pay.id,
                    CommissionLedger.tier_level == tier_level,
                )
                res = await session.execute(c_stmt)
                if not res.scalar_one_or_none():
                    session.add(CommissionLedger(
                        beneficiary_id=beneficiary.id,
                        order_payment_id=pay.id,
                        source_user_id=user_map[buyer_idx].id,
                        tier_level=tier_level,
                        commission_percent=rate * 100,
                        amount_toman=commission_amt,
                        status="matured",
                        created_at=pay.created_at + timedelta(minutes=5),
                        matured_at=pay.created_at + timedelta(minutes=5),
                    ))
                    beneficiary_wallet.balance_toman += commission_amt
                    beneficiary_wallet.withdrawable_balance_toman += commission_amt

                curr_child = parent_idx
                tier_level += 1

        await session.commit()
        print("  ✓ Wallets & referral commissions seeded.")

        # ---------------------------------------------------------------------
        # 5. Seed Settlement Accounts
        # ---------------------------------------------------------------------
        print("\n[5/11] Seeding Settlement Accounts...")
        settlement_accounts = {}
        if is_intl:
            settle_specs = [
                {"user_idx": 1, "type": "crypto", "network": "TRC20", "wallet": "TLyqzVGLV1srpH7LToTAgsQE1q854WNUSQ"},
                {"user_idx": 1, "type": "paypal", "holder": "Alex Turner", "email": "alex.turner@gmail.com"},
                {"user_idx": 2, "type": "crypto", "network": "ERC20", "wallet": "0x71C8451737402F0039209fA51996c5678ab267f8"},
                {"user_idx": 2, "type": "iban", "holder": "Sarah Connor", "iban": "DE89370400440532013000", "bank": "Deutsche Bank"},
                {"user_idx": 3, "type": "crypto", "network": "TRC20", "wallet": "TX9Y5x3v51s23jfk8q9asjdf923847alwe"},
                {"user_idx": 4, "type": "paypal", "holder": "Elena Vance", "email": "elena.vance@gmail.com"},
            ]
        else:
            settle_specs = [
                {"user_idx": 1, "type": "bank_iran", "sheba": "IR120120000000001234567890", "card": "6037997112345678", "holder": "امیرحسین محمدی", "bank": "بانک ملت"},
                {"user_idx": 1, "type": "crypto", "network": "TRC20", "wallet": "TLyqzVGLV1srpH7LToTAgsQE1q854WNUSQ"},
                {"user_idx": 2, "type": "bank_iran", "sheba": "IR340560000000009876543210", "card": "6219861098765432", "holder": "سارا علیزاده", "bank": "بانک سامان"},
                {"user_idx": 3, "type": "bank_iran", "sheba": "IR560170000000004567891230", "card": "5022291045678912", "holder": "علی رضایی", "bank": "بانک پاسارگاد"},
                {"user_idx": 4, "type": "bank_iran", "sheba": "IR780180000000003456789012", "card": "6274121134567890", "holder": "رضا کریمی", "bank": "بانک تجارت"},
            ]

        for s in settle_specs:
            user = user_map[s["user_idx"]]
            a_stmt = select(SettlementAccount).where(
                SettlementAccount.user_id == user.id,
                SettlementAccount.account_type == s["type"],
            )
            res = await session.execute(a_stmt)
            acc = res.scalar_one_or_none()
            if not acc:
                acc = SettlementAccount(
                    user_id=user.id,
                    account_type=s["type"],
                    sheba_number=s.get("sheba"),
                    card_number=s.get("card"),
                    account_holder=s.get("holder"),
                    bank_name=s.get("bank"),
                    crypto_wallet_address=s.get("wallet"),
                    crypto_network=s.get("network"),
                    is_verified=True,
                    is_active=True,
                    created_at=now - timedelta(days=20),
                )
                session.add(acc)
                await session.flush()
            settlement_accounts[f"{s['user_idx']}_{s['type']}"] = acc

        await session.commit()

        # ---------------------------------------------------------------------
        # 6. Seed Withdrawal Requests
        # ---------------------------------------------------------------------
        print("\n[6/11] Seeding Payout Requests...")
        if is_intl:
            w_specs = [
                {"user_idx": 1, "acc_key": "1_crypto", "amount": 1000000, "status": "approved", "notes": "USDT payout confirmed on TRC20: TxHash 7a2b9c...", "days_ago": 12},
                {"user_idx": 1, "acc_key": "1_paypal", "amount": 500000, "status": "pending", "notes": "Pending PayPal batch disbursement", "days_ago": 1},
                {"user_idx": 2, "acc_key": "2_iban", "amount": 400000, "status": "approved", "notes": "SEPA transfer processed to Deutsche Bank", "days_ago": 7},
            ]
        else:
            w_specs = [
                {"user_idx": 1, "acc_key": "1_bank_iran", "amount": 1000000, "status": "approved", "notes": "واریز پایا از حساب ملت انجام شد.", "days_ago": 12},
                {"user_idx": 1, "acc_key": "1_crypto", "amount": 500000, "status": "pending", "notes": "در انتظار تایید تراکنش تتر توسط واحد مالی.", "days_ago": 1},
                {"user_idx": 2, "acc_key": "2_bank_iran", "amount": 400000, "status": "approved", "notes": "واریز پایا بانک سامان با موفقیت نشست.", "days_ago": 7},
            ]

        for w in w_specs:
            user = user_map[w["user_idx"]]
            acc = settlement_accounts.get(w["acc_key"])
            if not acc:
                continue

            w_stmt = select(WithdrawalRequest).where(
                WithdrawalRequest.user_id == user.id,
                WithdrawalRequest.amount_toman == w["amount"],
                WithdrawalRequest.status == w["status"],
            )
            res = await session.execute(w_stmt)
            if not res.scalar_one_or_none():
                session.add(WithdrawalRequest(
                    user_id=user.id,
                    settlement_account_id=acc.id,
                    amount_toman=w["amount"],
                    status=w["status"],
                    admin_receipt_url="/uploads/receipts/receipt_001.jpg",
                    admin_notes=w["notes"],
                    created_at=now - timedelta(days=w["days_ago"]),
                    processed_at=now - timedelta(days=w["days_ago"] - 1) if w["status"] == "approved" else None,
                ))

        await session.commit()

        # ---------------------------------------------------------------------
        # 7. Seed Discount Codes
        # ---------------------------------------------------------------------
        print("\n[7/11] Seeding Discount Codes...")
        if is_intl:
            d_codes = [
                {"code": "GLOBAL2026", "percent": 20, "max_toman": 500000, "limit": 500, "used": 42},
                {"code": "SUMMER2026", "percent": 30, "max_toman": 1000000, "limit": 200, "used": 18},
                {"code": "VIPGOLD", "percent": 15, "max_toman": 450000, "limit": 1000, "used": 85},
                {"code": "GAMER50", "percent": 50, "max_toman": 1500000, "limit": 50, "used": 12},
            ]
        else:
            d_codes = [
                {"code": "DRGAME2026", "percent": 20, "max_toman": 500000, "limit": 500, "used": 42},
                {"code": "NOROOZ1404", "percent": 30, "max_toman": 1000000, "limit": 200, "used": 18},
                {"code": "VIPGOLD", "percent": 15, "max_toman": 450000, "limit": 1000, "used": 85},
                {"code": "GAMER50", "percent": 50, "max_toman": 1500000, "limit": 50, "used": 12},
            ]

        for dc in d_codes:
            dc_stmt = select(DiscountCode).where(DiscountCode.code == dc["code"])
            res = await session.execute(dc_stmt)
            if not res.scalar_one_or_none():
                session.add(DiscountCode(
                    code=dc["code"],
                    discount_percent=dc["percent"],
                    max_discount_toman=dc["max_toman"],
                    fixed_discount_toman=0,
                    usage_limit=dc["limit"],
                    used_count=dc["used"],
                    is_active=True,
                    expires_at=now + timedelta(days=90),
                    created_at=now - timedelta(days=30),
                ))

        await session.commit()

        # ---------------------------------------------------------------------
        # 8. Seed Download Files for Catalog Games
        # ---------------------------------------------------------------------
        print("\n[8/11] Seeding Download Files for Existing Catalog Games...")
        g_stmt = select(Game).where(Game.is_active == True)
        res = await session.execute(g_stmt)
        games = list(res.scalars().all())

        all_game_files = []
        download_files_created = 0

        for g in games:
            existing_f_stmt = select(GameDownloadFile).where(GameDownloadFile.game_id == g.id)
            f_res = await session.execute(existing_f_stmt)
            existing_files = {f.file_type: f for f in f_res.scalars().all()}

            if is_intl:
                files_spec = [
                    {"type": "base_game", "title": f"{g.title_en} - Official Base Game PKG (v1.00)", "size_gb": 42.5, "url": f"https://dl.drgame.local/games/{g.slug}/base.pkg", "version": "v1.00", "tiers": ["free", "bronze", "silver", "gold"]},
                    {"type": "update", "title": f"{g.title_en} - Cumulative Patch Update v1.08 (Backported)", "size_gb": 12.3, "url": f"https://dl.drgame.local/games/{g.slug}/update_v108.pkg", "version": "v1.08", "tiers": ["bronze", "silver", "gold"]},
                    {"type": "dlc", "title": f"{g.title_en} - Season Pass & All Story DLCs Pack", "size_gb": 8.7, "url": f"https://dl.drgame.local/games/{g.slug}/dlc_pack.pkg", "version": "v1.0", "tiers": ["silver", "gold"]},
                    {"type": "subtitles", "title": f"{g.title_en} - Complete Multi-Language Subtitles Pack", "size_gb": 0.35, "url": f"https://dl.drgame.local/games/{g.slug}/subtitles.pkg", "version": "v2.0", "tiers": ["silver", "gold"]},
                    {"type": "cheat", "title": f"{g.title_en} - GoldHEN Trainer & 100% Save Data Mod", "size_gb": 0.05, "url": f"https://dl.drgame.local/games/{g.slug}/cheats.pkg", "version": "v1.0", "tiers": ["gold"]},
                ]
            else:
                files_spec = [
                    {"type": "base_game", "title": f"دیتای اصلی بازی {g.title_fa} (نسخه کامل v1.00)", "size_gb": 42.5, "url": f"https://dl.drgame.local/games/{g.slug}/base.pkg", "version": "v1.00", "tiers": ["free", "bronze", "silver", "gold"]},
                    {"type": "update", "title": f"آخرین آپدیت رسمی بک‌پورت شده {g.title_fa} نسخه v1.08", "size_gb": 12.3, "url": f"https://dl.drgame.local/games/{g.slug}/update_v108.pkg", "version": "v1.08", "tiers": ["bronze", "silver", "gold"]},
                    {"type": "dlc", "title": f"پکیج تمام بسته‌های الحاقی و مراحل اضافه (DLC Pack)", "size_gb": 8.7, "url": f"https://dl.drgame.local/games/{g.slug}/dlc_pack.pkg", "version": "v1.0", "tiers": ["silver", "gold"]},
                    {"type": "subtitles", "title": f"زیرنویس فارسی اختصاصی و کامل تیم دکتر گیم", "size_gb": 0.35, "url": f"https://dl.drgame.local/games/{g.slug}/subtitles_fa.pkg", "version": "v2.0", "tiers": ["silver", "gold"]},
                    {"type": "cheat", "title": f"ترینر، سیو ۱۰۰٪ و پکیج چیت کدها (GoldHEN Trainer)", "size_gb": 0.05, "url": f"https://dl.drgame.local/games/{g.slug}/cheats.pkg", "version": "v1.0", "tiers": ["gold"]},
                ]

            for fs in files_spec:
                if fs["type"] not in existing_files:
                    new_file = GameDownloadFile(
                        game_id=g.id,
                        file_type=fs["type"],
                        title=fs["title"],
                        file_size_gb=fs["size_gb"],
                        size_bytes=int(fs["size_gb"] * 1024**3),
                        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                        download_url=fs["url"],
                        allowed_tiers=fs["tiers"],
                        version=fs["version"],
                        is_active=True,
                        created_at=now - timedelta(days=30),
                    )
                    session.add(new_file)
                    all_game_files.append(new_file)
                    download_files_created += 1
                else:
                    all_game_files.append(existing_files[fs["type"]])

        await session.commit()
        print(f"  ✓ Processed download files across {len(games)} catalog games.")

        # ---------------------------------------------------------------------
        # 9. Seed Download History
        # ---------------------------------------------------------------------
        print("\n[9/11] Seeding User Download History and Quota Deductions...")
        if all_game_files:
            history_specs = [(1, 0, 10), (1, 1, 9), (2, 0, 12), (3, 0, 14), (4, 0, 7), (5, 0, 5), (8, 0, 4)]
            for u_idx, f_idx, days_ago in history_specs:
                if f_idx < len(all_game_files):
                    user = user_map[u_idx]
                    target_file = all_game_files[f_idx]
                    dh_stmt = select(UserDownloadHistory).where(
                        UserDownloadHistory.user_id == user.id,
                        UserDownloadHistory.file_id == target_file.id,
                    )
                    res = await session.execute(dh_stmt)
                    if not res.scalar_one_or_none():
                        session.add(UserDownloadHistory(
                            user_id=user.id,
                            game_id=target_file.game_id,
                            file_id=target_file.id,
                            file_type=target_file.file_type,
                            file_title=target_file.title,
                            file_size_gb=target_file.file_size_gb,
                            downloaded_at=now - timedelta(days=days_ago),
                        ))

            await session.commit()

        # ---------------------------------------------------------------------
        # 10. Seed Realistic Support Tickets
        # ---------------------------------------------------------------------
        print(f"\n[10/11] Seeding Realistic Support Tickets [{mode}]...")
        if is_intl:
            tickets_data = [
                {
                    "user_idx": 1,
                    "subject": "Guidance on running Marvel's Spider-Man on PS4 9.00 GoldHEN",
                    "dept": "technical",
                    "priority": "normal",
                    "status": "answered",
                    "days_ago": 6,
                    "messages": [
                        ("user", "Alex Turner", "Hello! I downloaded Spider-Man Remastered. My console is on firmware 9.00 with GoldHEN 2.3. Is a backport patch required or can I install directly via Package Installer?"),
                        ("admin", "DrGame Technical Support", "Hello Alex! The PKG on our CDN is pre-backported for firmware 9.00 and above. You can install it directly from an exFAT USB without separate patches."),
                        ("user", "Alex Turner", "Awesome, tested and working flawlessly. Thanks for the quick support!"),
                    ],
                },
                {
                    "user_idx": 2,
                    "subject": "Payout Status Inquiry for TRC20 USDT Withdrawal",
                    "dept": "financial",
                    "priority": "urgent",
                    "status": "closed",
                    "days_ago": 7,
                    "messages": [
                        ("user", "Sarah Connor", "Hi, I requested a $40 USDT payout on Saturday. Could you provide the TRC20 transaction hash?"),
                        ("admin", "DrGame Finance Department", "Greetings Sarah. Your payout has been broadcast to TRON network. TxHash: 7a2b9c4819d08e. The funds have been successfully settled."),
                        ("user", "Sarah Connor", "Received in my wallet! Thank you for the super fast payout."),
                    ],
                },
                {
                    "user_idx": 3,
                    "subject": "Direct LAN Transfer setup without Internet bandwidth consumption",
                    "dept": "technical",
                    "priority": "medium",
                    "status": "answered",
                    "days_ago": 4,
                    "messages": [
                        ("user", "Liam Davis", "Hi team, does DrGame support direct PC-to-PS5 LAN transfers via PSX Download Helper?"),
                        ("admin", "DrGame Technical Support", "Yes Liam! You can route downloads through local gigabit ethernet. Our tutorial section has a complete walkthrough with zero Internet consumption."),
                    ],
                },
                {
                    "user_idx": 5,
                    "subject": "Tier 2 and Tier 3 referral commission structure breakdown",
                    "dept": "financial",
                    "priority": "normal",
                    "status": "answered",
                    "days_ago": 5,
                    "messages": [
                        ("user", "Kenji Sato", "Hello! If my referred friend invites 2 new gamers, what commission percentage do I receive from their subscriptions?"),
                        ("admin", "DrGame Community Support", "Greetings Kenji! In our waterfall referral model, you receive 50% from Tier 1, 25% from Tier 2, and 12.5% from Tier 3 purchases instantaneously into your wallet."),
                    ],
                },
            ]
        else:
            tickets_data = [
                {
                    "user_idx": 1,
                    "subject": "راهنمایی در مورد اجرای دیتای Marvel's Spider-Man روی فریمور 9.00",
                    "dept": "technical",
                    "priority": "normal",
                    "status": "answered",
                    "days_ago": 6,
                    "messages": [
                        ("user", "امیرحسین محمدی", "سلام وقت بخیر. من دیتای اسپایدرمن ریمسترد رو دانلود کردم. کنسول من فت روی فریمور 9.00 با گلدهن 2.3 هست. آیا پچ بک‌پورت هم نیازه یا مستقیما از طریق Package Installer نصب میشه؟"),
                        ("admin", "پشتیبانی فنی دکتر گیم", "درود بر شما کاربر گرامی. نسخه قرار گرفته روی سرورهای دکتر گیم به صورت اتوماتیک بک‌پورت شده و با فریمور 9.00 به بالا کاملاً سازگار است. نیازی به نصب پچ مجزا ندارید."),
                        ("user", "امیرحسین محمدی", "خیلی ممنون، تست کردم و بدون هیچ مشکلی اجرا شد. تشکر از پاسخگویی سریع تیم فنی دکتر گیم."),
                    ],
                },
                {
                    "user_idx": 2,
                    "subject": "استعلام واریز تسویه حساب شماره شبا بانک سامان",
                    "dept": "financial",
                    "priority": "urgent",
                    "status": "closed",
                    "days_ago": 7,
                    "messages": [
                        ("user", "سارا علیزاده", "سلام، من روز شنبه درخواست تسویه حساب ۴۰۰ هزار تومانی ثبت کردم. شماره پیگیری شاپرک رو میخواستم."),
                        ("admin", "امور مالی دکتر گیم", "با سلام سرکار خانم علیزاده. درخواست تسویه شما در چرخه پایا انجام شد. شماره پیگیری: 894321074."),
                        ("user", "سارا علیزاده", "سلام، رسید رو دیدم و مبلغ هم به حساب نشست. ممنون از شما."),
                    ],
                },
            ]

        for td in tickets_data:
            user = user_map[td["user_idx"]]
            t_stmt = select(Ticket).where(Ticket.user_id == user.id, Ticket.subject == td["subject"])
            res = await session.execute(t_stmt)
            ticket = res.scalar_one_or_none()

            if not ticket:
                ticket = Ticket(
                    user_id=user.id,
                    user_name=user.full_name,
                    user_phone=user.phone,
                    subject=td["subject"],
                    department=td["dept"],
                    priority=td["priority"],
                    status=td["status"],
                    created_at=now - timedelta(days=td["days_ago"]),
                    updated_at=now - timedelta(days=td["days_ago"]),
                )
                session.add(ticket)
                await session.flush()

                msg_offset = 0
                for sender_type, sender_name, msg_text in td["messages"]:
                    sender_id = user.id if sender_type == "user" else 1
                    session.add(TicketMessage(
                        ticket_id=ticket.id,
                        sender_type=sender_type,
                        sender_id=sender_id,
                        sender_name=sender_name,
                        message=msg_text,
                        created_at=ticket.created_at + timedelta(minutes=msg_offset * 25),
                    ))
                    msg_offset += 1

        await session.commit()
        print("  ✓ Support tickets and threaded conversations seeded.")

        # ---------------------------------------------------------------------
        # 11. Seed Notifications & Device Telemetry
        # ---------------------------------------------------------------------
        print("\n[11/11] Seeding In-App Notifications and Console Telemetry...")
        if is_intl:
            notifications = [
                (1, "Welcome to DrGame Gold VIP!", "Your Gold VIP subscription is active with 2,200 GB quota. Enjoy blazing fast speeds!", "system", True, 15),
                (1, "Referral Commission Earned", "You earned +$15.00 USDT from Sarah Connor's Gold tier purchase.", "commission", True, 10),
                (2, "Payout Processed Successfully", "Your payout request of $40.00 USDT has been successfully settled.", "system", True, 7),
            ]
        else:
            notifications = [
                (1, "خوش‌آمدید به جمع طلایی‌های دکتر گیم!", "اشتراک VIP طلایی شما به مدت ۳۰ روز و حجم ۲۲۰۰ گیگابایت فعال شد. از سرعت نامحدود لذت ببرید.", "system", True, 15),
                (1, "واریز پورسانت رفرال سطح ۱", "مبلغ ۱۵۰,۰۰۰ تومان از خرید اشتراک طلایی توسط سارا علیزاده به کیف پول شما واریز شد.", "commission", True, 10),
                (2, "خوش‌آمدید به خانواده دکتر گیم!", "اشتراک طلایی شما فعال شد. دسترسی به تمام عناوین رسمی برای شما فراهم است.", "system", True, 14),
            ]

        for u_idx, title, msg, n_type, is_read, days_ago in notifications:
            user = user_map[u_idx]
            n_stmt = select(UserNotification).where(
                UserNotification.user_id == user.id,
                UserNotification.title == title,
            )
            res = await session.execute(n_stmt)
            if not res.scalar_one_or_none():
                session.add(UserNotification(
                    user_id=user.id,
                    title=title,
                    message=msg,
                    notification_type=n_type,
                    is_read=is_read,
                    created_at=now - timedelta(days=days_ago),
                ))

        # Console Hardware Device Registrations & Telemetry
        devices_data = [
            (1, "JKT-PS5-ALEX-001" if is_intl else "JKT-PS5-AMIR-001", "PS5 Digital Edition (CFI-1200)", 825 * 1024**3, 412 * 1024**3),
            (2, "JKT-PS4-SARA-002", "PS4 Pro 1TB (CUH-7200)", 1000 * 1024**3, 230 * 1024**3),
            (3, "JKT-PS5-LIAM-003" if is_intl else "JKT-PS5-ALI-003", "PS5 Disc Edition (CFI-1100)", 825 * 1024**3, 580 * 1024**3),
        ]

        for u_idx, jkt, dev_name, total_b, free_b in devices_data:
            user = user_map[u_idx]
            d_stmt = select(RegisteredDevice).where(RegisteredDevice.jkt == jkt)
            res = await session.execute(d_stmt)
            if not res.scalar_one_or_none():
                session.add(RegisteredDevice(
                    jkt=jkt,
                    user_id=user.id,
                    device_name=dev_name,
                    public_jwk={"kty": "RSA", "n": "demo_jwk_key", "e": "AQAB", "kid": jkt},
                    created_at=now - timedelta(days=25),
                    last_seen_at=now - timedelta(hours=2),
                ))

            sr_stmt = select(DeviceStorageReport).where(DeviceStorageReport.jwk_thumbprint == jkt)
            res = await session.execute(sr_stmt)
            if not res.scalar_one_or_none():
                session.add(DeviceStorageReport(
                    jwk_thumbprint=jkt,
                    volume="/data",
                    total_bytes=total_b,
                    free_bytes=free_b,
                    reported_at=now - timedelta(hours=1),
                ))

        await session.commit()
        print("  ✓ Notifications and PS4/PS5 hardware storage telemetry seeded.")

    print("\n=================================================================")
    print(f"✅ All Platform Demo Data Successfully Seeded in [{mode.upper()}] Mode!")
    print(f"   - 20 Customer Users (09000000001 - 09000000020)")
    print("   - Multi-Tier Referral Tree & Commissions")
    print("   - Active Subscriptions (Gold, Silver, Bronze, Free)")
    print("   - Payments, Wallets, Settlement Accounts & Payout Requests")
    print("   - Download Files for Catalog Games & Download Histories")
    print("   - Threaded Support Tickets & Notifications")
    print("   - PS4/PS5 Hardware Device Storage Telemetry")
    print("=================================================================\n")


def main():
    parser = argparse.ArgumentParser(description="DrGame Platform Database Seeder")
    parser.add_argument(
        "--mode",
        choices=["domestic", "international"],
        default=os.getenv("DEPLOYMENT_MODE", "domestic"),
        help="Target deployment mode (domestic or international)",
    )
    args = parser.parse_args()
    asyncio.run(seed_data(mode=args.mode))


if __name__ == "__main__":
    main()
