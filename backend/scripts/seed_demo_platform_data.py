"""Platform Database Seeder Script for DrGame.

Populates the platform database with realistic, high-fidelity Iranian gamer customer accounts,
multi-level referral trees, active and past subscriptions, payment transactions, wallet commissions,
settlement accounts, payout requests, download history, support tickets, notifications, and device telemetry.

Rules:
- Does NOT add or alter admins.
- Does NOT add or alter game catalog entries (uses existing 12 games).
- Customer phones strictly follow 09000000001 to 09000000020.
- Names are realistic Persian full names with meaningful gamer handles.
- Fully idempotent: can be executed repeatedly without duplication or errors.
"""

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
from app.modules.quota.models import UserQuota, QuotaConsumptionLog
from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
from app.modules.dpop.models import RegisteredDevice, DeviceStorageReport

# -----------------------------------------------------------------------------
# 20 Realistic Persian Gamer Profiles
# -----------------------------------------------------------------------------
USER_PROFILES = [
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
        "used_gb": 315.4,
        "role_desc": "کاربر پلی‌استیشن ۵ و علاقمند به گرافیک 4K",
    },
    {
        "index": 6,
        "phone": "09000000006",
        "username": "fatemeh_m",
        "full_name": "فاطمه مرادی",
        "email": "fatemeh.moradi@outlook.com",
        "console_auth_code": "DG10006",
        "referral_code": "DRG0006",
        "avatar_url": "/avatars/avatar-6.png",
        "hero_banner_url": "/banners/banner-6.jpg",
        "tier": "gold",
        "used_gb": 489.1,
        "role_desc": "علاقمند به بازی‌های نقش‌آفرینی و جهان‌باز",
    },
    {
        "index": 7,
        "phone": "09000000007",
        "username": "pouya_kazemi",
        "full_name": "پویا کاظمی",
        "email": "pouya.kazemi@gmail.com",
        "console_auth_code": "DG10007",
        "referral_code": "DRG0007",
        "avatar_url": "/avatars/avatar-7.png",
        "hero_banner_url": "/banners/banner-7.jpg",
        "tier": "bronze",
        "used_gb": 145.2,
        "role_desc": "گیمر سبک شوتر و مبارزه‌ای",
    },
    {
        "index": 8,
        "phone": "09000000008",
        "username": "kian_hunter",
        "full_name": "کیان اکبری",
        "email": "kian.akbari@gmail.com",
        "console_auth_code": "DG10008",
        "referral_code": "DRG0008",
        "avatar_url": "/avatars/avatar-8.png",
        "hero_banner_url": "/banners/banner-8.jpg",
        "tier": "silver",
        "used_gb": 198.0,
        "role_desc": "شکارچی تروفی‌های پلاتینیوم",
    },
    {
        "index": 9,
        "phone": "09000000009",
        "username": "negar_hoss",
        "full_name": "نگار حسینی",
        "email": "negar.hosseini@gmail.com",
        "console_auth_code": "DG10009",
        "referral_code": "DRG0009",
        "avatar_url": "/avatars/avatar-9.png",
        "hero_banner_url": "/banners/banner-9.jpg",
        "tier": "gold",
        "used_gb": 312.6,
        "role_desc": "طرفدار سرسخت فرانچایزهای ماجراجویی",
    },
    {
        "index": 10,
        "phone": "09000000010",
        "username": "armin_shadow",
        "full_name": "آرمین ابراهیمی",
        "email": "armin.ebrahimi@gmail.com",
        "console_auth_code": "DG10010",
        "referral_code": "DRG0010",
        "avatar_url": "/avatars/avatar-10.png",
        "hero_banner_url": "/banners/banner-10.jpg",
        "tier": "silver",
        "used_gb": 280.0,
        "role_desc": "گیمر سولزبورن و نقش‌آفرینی ژاپنی",
    },
    {
        "index": 11,
        "phone": "09000000011",
        "username": "behnam_t",
        "full_name": "بهنام طاهری",
        "email": "behnam.taheri@yahoo.com",
        "console_auth_code": "DG10011",
        "referral_code": "DRG0011",
        "avatar_url": "/avatars/avatar-11.png",
        "hero_banner_url": "/banners/banner-11.jpg",
        "tier": "bronze",
        "used_gb": 95.0,
        "role_desc": "علاقمند به بازی‌های دونفره و کوآپ",
    },
    {
        "index": 12,
        "phone": "09000000012",
        "username": "maryam_sh",
        "full_name": "مریم شجاعی",
        "email": "maryam.shojaei@gmail.com",
        "console_auth_code": "DG10012",
        "referral_code": "DRG0012",
        "avatar_url": "/avatars/avatar-12.png",
        "hero_banner_url": "/banners/banner-12.jpg",
        "tier": "gold",
        "used_gb": 530.8,
        "role_desc": "گیمر شبیه‌ساز و پازل‌های معمایی",
    },
    {
        "index": 13,
        "phone": "09000000013",
        "username": "vahid_rostami",
        "full_name": "وحید رستمی",
        "email": "vahid.rostami@gmail.com",
        "console_auth_code": "DG10013",
        "referral_code": "DRG0013",
        "avatar_url": "/avatars/avatar-13.png",
        "hero_banner_url": "/banners/banner-13.jpg",
        "tier": "silver",
        "used_gb": 240.0,
        "role_desc": "علاقمند به سرعت، ریسینگ و مسابقه‌ای",
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
# Referral Hierarchy Mapping (User index -> Referrer User index)
# -----------------------------------------------------------------------------
REFERRAL_TREE = {
    # User 1 is top master ambassador (no referrer)
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 3,
    7: 3,
    8: 4,
    9: 4,
    10: 5,
    11: 5,
    12: 6,
    13: 6,
    14: 8,
    15: 8,
    16: 10,
    17: 10,
    18: 12,
    19: 14,
    20: 16,
}

# -----------------------------------------------------------------------------
# Tier Configs
# -----------------------------------------------------------------------------
TIER_PRICES = {
    "gold": (3000000, 2200.0),
    "silver": (1500000, 1000.0),
    "bronze": (700000, 500.0),
    "free": (0, 0.0),
}


async def seed_data():
    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password("User@123456")

    print("=================================================================")
    print("🚀 Starting DrGame Realistic Platform Database Seeder...")
    print("=================================================================")

    async with AsyncSessionLocal() as session:
        # ---------------------------------------------------------------------
        # 1. Seed or Update 20 Customers / Users
        # ---------------------------------------------------------------------
        print("\n[1/11] Seeding 20 Customer Users (09000000001 -> 09000000020)...")
        user_map: dict[int, User] = {}  # index -> User entity

        for prof in USER_PROFILES:
            stmt = select(User).where(User.phone == prof["phone"])
            res = await session.execute(stmt)
            existing_user = res.scalar_one_or_none()

            if not existing_user:
                # Also check username just in case
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
                print(f"  * Synced Referral: {child_user.username} invited by {parent_user.username}")

        await session.commit()

        # ---------------------------------------------------------------------
        # 3. Seed Subscriptions, Quotas, and Order Payments
        # ---------------------------------------------------------------------
        print("\n[3/11] Seeding Subscriptions, Quotas, and Payment Transactions...")
        user_payments: dict[int, OrderPayment] = {}  # index -> latest paid OrderPayment

        for prof in USER_PROFILES:
            user = user_map[prof["index"]]
            tier_code = prof["tier"]
            price_toman, total_quota_gb = TIER_PRICES[tier_code]

            # 3a. Order Payment (for paid tiers)
            if price_toman > 0:
                trx_ref = f"TRX-202611-{prof['index']:02d}-{tier_code.upper()}"
                pay_stmt = select(OrderPayment).where(OrderPayment.transaction_ref == trx_ref)
                res = await session.execute(pay_stmt)
                payment = res.scalar_one_or_none()

                discount_amount = 0
                if prof["index"] in [2, 6]:
                    discount_amount = int(price_toman * 0.20)  # 20% discount applied

                final_price = price_toman - discount_amount

                if not payment:
                    payment = OrderPayment(
                        user_id=user.id,
                        tier_code=tier_code,
                        original_price=price_toman,
                        discount_amount=discount_amount,
                        final_price=final_price,
                        discount_code_used="DRGAME2026" if discount_amount > 0 else None,
                        payment_method="zarinpal" if prof["index"] % 2 == 0 else "simulation",
                        transaction_ref=trx_ref,
                        status="paid",
                        created_at=now - timedelta(days=15),
                    )
                    session.add(payment)
                    await session.flush()
                user_payments[prof["index"]] = payment
            else:
                payment = None

            # 3b. User Subscription
            sub_stmt = select(UserSubscription).where(
                UserSubscription.user_id == user.id,
                UserSubscription.status == "active",
            )
            res = await session.execute(sub_stmt)
            sub = res.scalar_one_or_none()

            if not sub:
                sub = UserSubscription(
                    user_id=user.id,
                    tier_code=tier_code,
                    start_date=now - timedelta(days=15),
                    end_date=now + timedelta(days=15),
                    status="active",
                    payment_id=payment.id if payment else None,
                )
                session.add(sub)
            else:
                sub.tier_code = tier_code
                sub.status = "active"
                sub.end_date = now + timedelta(days=15)
                sub.payment_id = payment.id if payment else None

            # 3c. User Quota
            quota_stmt = select(UserQuota).where(UserQuota.user_id == user.id)
            res = await session.execute(quota_stmt)
            quota = res.scalar_one_or_none()

            used_gb = prof["used_gb"]
            rem_gb = max(0.0, total_quota_gb - used_gb)

            if not quota:
                quota = UserQuota(
                    user_id=user.id,
                    total_quota_gb=total_quota_gb,
                    used_quota_gb=used_gb,
                    remaining_quota_gb=rem_gb,
                    updated_at=now,
                )
                session.add(quota)
            else:
                quota.total_quota_gb = total_quota_gb
                quota.used_quota_gb = used_gb
                quota.remaining_quota_gb = rem_gb
                quota.updated_at = now

        await session.commit()
        print("  ✓ Subscriptions, payments, and quotas seeded successfully.")

        # ---------------------------------------------------------------------
        # 4. Seed Multi-Tier Referral Commission Ledgers & Wallets
        # ---------------------------------------------------------------------
        print("\n[4/11] Seeding Referral Commission Ledgers and Wallets...")

        # Calculate realistic commissions based on payments in referral tree
        # L1: 50% of pool (pool = 10% of subscription price), L2: 25%, L3: 12.5%
        # Or direct: 10% of purchase split: L1: 5%, L2: 2.5%, L3: 1.25%
        # Let's use standard realistic DrGame commissions:
        # Gold (3M): L1: 150,000, L2: 75,000, L3: 37,500 Toman
        # Silver (1.5M): L1: 75,000, L2: 37,500, L3: 18,750 Toman
        # Bronze (700k): L1: 35,000, L2: 17,500, L3: 8,750 Toman

        COMMISSION_RATES = {
            "gold": {1: 150000, 2: 75000, 3: 37500},
            "silver": {1: 75000, 2: 37500, 3: 18750},
            "bronze": {1: 35000, 2: 17500, 3: 8750},
        }

        # Clear existing demo commission ledgers for these specific 20 users payments
        payment_ids = [p.id for p in user_payments.values()]
        if payment_ids:
            await session.execute(
                delete(CommissionLedger).where(CommissionLedger.order_payment_id.in_(payment_ids))
            )

        wallet_totals: dict[int, dict] = {
            prof["index"]: {"withdrawable": 0, "pending": 0, "earned": 0, "withdrawn": 0}
            for prof in USER_PROFILES
        }

        for child_idx, parent_idx in REFERRAL_TREE.items():
            if child_idx not in user_payments:
                continue

            payment = user_payments[child_idx]
            tier_code = payment.tier_code
            if tier_code not in COMMISSION_RATES:
                continue

            child_user = user_map[child_idx]
            rates = COMMISSION_RATES[tier_code]

            # Level 1 Parent
            p1_idx = parent_idx
            p1_user = user_map[p1_idx]
            l1_amt = rates[1]

            session.add(CommissionLedger(
                order_payment_id=payment.id,
                beneficiary_type="user",
                user_id=p1_user.id,
                tier_level=1,
                amount_toman=l1_amt,
                currency="IRT",
                description=f"پورسانت سطح ۱ از خرید اشتراک {tier_code} توسط {child_user.full_name}",
                settlement_status="settled",
                settled_at=now - timedelta(days=10),
                created_at=payment.created_at,
            ))
            wallet_totals[p1_idx]["earned"] += l1_amt
            wallet_totals[p1_idx]["withdrawable"] += l1_amt

            # Level 2 Grandparent
            if p1_idx in REFERRAL_TREE:
                p2_idx = REFERRAL_TREE[p1_idx]
                p2_user = user_map[p2_idx]
                l2_amt = rates[2]

                session.add(CommissionLedger(
                    order_payment_id=payment.id,
                    beneficiary_type="user",
                    user_id=p2_user.id,
                    tier_level=2,
                    amount_toman=l2_amt,
                    currency="IRT",
                    description=f"پورسانت سطح ۲ از خرید اشتراک {tier_code} توسط {child_user.full_name}",
                    settlement_status="settled",
                    settled_at=now - timedelta(days=10),
                    created_at=payment.created_at,
                ))
                wallet_totals[p2_idx]["earned"] += l2_amt
                wallet_totals[p2_idx]["withdrawable"] += l2_amt

                # Level 3 Great-Grandparent
                if p2_idx in REFERRAL_TREE:
                    p3_idx = REFERRAL_TREE[p2_idx]
                    p3_user = user_map[p3_idx]
                    l3_amt = rates[3]

                    session.add(CommissionLedger(
                        order_payment_id=payment.id,
                        beneficiary_type="user",
                        user_id=p3_user.id,
                        tier_level=3,
                        amount_toman=l3_amt,
                        currency="IRT",
                        description=f"پورسانت سطح ۳ از خرید اشتراک {tier_code} توسط {child_user.full_name}",
                        settlement_status="settled",
                        settled_at=now - timedelta(days=10),
                        created_at=payment.created_at,
                    ))
                    wallet_totals[p3_idx]["earned"] += l3_amt
                    wallet_totals[p3_idx]["withdrawable"] += l3_amt

        # Add simulated past withdrawals for top ambassadors to make balances realistic
        wallet_totals[1]["withdrawn"] = 1000000
        wallet_totals[1]["withdrawable"] = max(0, wallet_totals[1]["withdrawable"] - 1000000)

        wallet_totals[2]["withdrawn"] = 400000
        wallet_totals[2]["withdrawable"] = max(0, wallet_totals[2]["withdrawable"] - 400000)

        wallet_totals[3]["withdrawn"] = 250000
        wallet_totals[3]["withdrawable"] = max(0, wallet_totals[3]["withdrawable"] - 250000)

        # Update or create user wallets
        for idx, totals in wallet_totals.items():
            user = user_map[idx]
            w_stmt = select(UserWallet).where(UserWallet.user_id == user.id)
            res = await session.execute(w_stmt)
            wallet = res.scalar_one_or_none()

            if not wallet:
                wallet = UserWallet(
                    user_id=user.id,
                    currency="IRT",
                    withdrawable_balance_toman=totals["withdrawable"],
                    pending_balance_toman=totals["pending"],
                    total_earned_toman=totals["earned"],
                    total_withdrawn_toman=totals["withdrawn"],
                    updated_at=now,
                )
                session.add(wallet)
            else:
                wallet.withdrawable_balance_toman = totals["withdrawable"]
                wallet.pending_balance_toman = totals["pending"]
                wallet.total_earned_toman = totals["earned"]
                wallet.total_withdrawn_toman = totals["withdrawn"]
                wallet.updated_at = now

        await session.commit()
        print("  ✓ Commission ledgers and wallets populated successfully.")

        # ---------------------------------------------------------------------
        # 5. Seed Settlement Accounts (Iranian Sheba & Crypto USDT)
        # ---------------------------------------------------------------------
        print("\n[5/11] Seeding Settlement Accounts...")
        settlement_accounts: dict[int, SettlementAccount] = {}

        accounts_data = [
            {
                "user_idx": 1,
                "account_type": "bank_iran",
                "bank_name": "بانک ملت",
                "sheba_number": "IR540120000000008765432101",
                "card_number": "6104337890123456",
                "account_holder": "امیرحسین محمدی",
                "national_code": "0012345678",
                "phone": "09000000001",
            },
            {
                "user_idx": 1,
                "account_type": "crypto",
                "crypto_wallet_address": "TXr8K9mLPq7Z1o2vNt6Y4j3wHsBvAcE9z1",
                "crypto_network": "TRC20",
            },
            {
                "user_idx": 2,
                "account_type": "bank_iran",
                "bank_name": "بانک سامان",
                "sheba_number": "IR820560000000001234567801",
                "card_number": "6219861045678901",
                "account_holder": "سارا علیزاده",
                "national_code": "0023456789",
                "phone": "09000000002",
            },
            {
                "user_idx": 3,
                "account_type": "bank_iran",
                "bank_name": "بانک پاسارگاد",
                "sheba_number": "IR770570000000009876543201",
                "card_number": "5022291034567890",
                "account_holder": "علی رضایی",
                "national_code": "0034567890",
                "phone": "09000000003",
            },
            {
                "user_idx": 4,
                "account_type": "bank_iran",
                "bank_name": "بانک ملی ایران",
                "sheba_number": "IR120170000000005432109801",
                "card_number": "6037991823456789",
                "account_holder": "رضا کریمی",
                "national_code": "0045678901",
                "phone": "09000000004",
            },
            {
                "user_idx": 5,
                "account_type": "bank_iran",
                "bank_name": "بانک تجارت",
                "sheba_number": "IR340180000000006543210901",
                "card_number": "5859831098765432",
                "account_holder": "مهدی احمدی",
                "national_code": "0056789012",
                "phone": "09000000005",
            },
            {
                "user_idx": 6,
                "account_type": "bank_iran",
                "bank_name": "بانک پارسیان",
                "sheba_number": "IR440540000000007654321091",
                "card_number": "6221061087654321",
                "account_holder": "فاطمه مرادی",
                "national_code": "0067890123",
                "phone": "09000000006",
            },
            {
                "user_idx": 8,
                "account_type": "crypto",
                "crypto_wallet_address": "0x71C3b7C8A60e40C2f9D19E7b8a8b276E1744b6Eb",
                "crypto_network": "ERC20",
            },
            {
                "user_idx": 10,
                "account_type": "bank_iran",
                "bank_name": "بانک کشاورزی",
                "sheba_number": "IR990160000000008765432110",
                "card_number": "6037701654321098",
                "account_holder": "آرمین ابراهیمی",
                "national_code": "0078901234",
                "phone": "09000000010",
            },
        ]

        for acc in accounts_data:
            user = user_map[acc["user_idx"]]
            acc_stmt = select(SettlementAccount).where(
                SettlementAccount.user_id == user.id,
                SettlementAccount.account_type == acc["account_type"],
            )
            res = await session.execute(acc_stmt)
            account = res.scalar_one_or_none()

            if not account:
                account = SettlementAccount(
                    user_id=user.id,
                    account_type=acc["account_type"],
                    sheba_number=acc.get("sheba_number"),
                    card_number=acc.get("card_number"),
                    account_holder=acc.get("account_holder"),
                    bank_name=acc.get("bank_name"),
                    national_code=acc.get("national_code"),
                    phone=acc.get("phone"),
                    crypto_wallet_address=acc.get("crypto_wallet_address"),
                    crypto_network=acc.get("crypto_network"),
                    is_verified=True,
                    is_active=True,
                    created_at=now - timedelta(days=20),
                )
                session.add(account)
                await session.flush()
            settlement_accounts[f"{acc['user_idx']}_{acc['account_type']}"] = account

        await session.commit()
        print("  ✓ Settlement accounts seeded successfully.")

        # ---------------------------------------------------------------------
        # 6. Seed Withdrawal Requests
        # ---------------------------------------------------------------------
        print("\n[6/11] Seeding Payout / Withdrawal Requests...")
        withdrawals_data = [
            {
                "user_idx": 1,
                "acc_key": "1_bank_iran",
                "amount": 1000000,
                "status": "approved",
                "admin_receipt_url": "/uploads/receipts/paya_mellat_001.jpg",
                "admin_notes": "واریز پایا از حساب ملت به شماره پیگیری ۹۸۲۳۴۱ شاپرک انجام شد.",
                "days_ago": 12,
            },
            {
                "user_idx": 1,
                "acc_key": "1_crypto",
                "amount": 500000,
                "status": "pending",
                "admin_receipt_url": None,
                "admin_notes": "در انتظار تایید تراکنش تتر توسط واحد مالی.",
                "days_ago": 1,
            },
            {
                "user_idx": 2,
                "acc_key": "2_bank_iran",
                "amount": 400000,
                "status": "approved",
                "admin_receipt_url": "/uploads/receipts/paya_saman_001.jpg",
                "admin_notes": "واریز پایا بانک سامان با موفقیت نشست.",
                "days_ago": 7,
            },
            {
                "user_idx": 2,
                "acc_key": "2_bank_iran",
                "amount": 200000,
                "status": "pending",
                "admin_receipt_url": None,
                "admin_notes": None,
                "days_ago": 0,
            },
            {
                "user_idx": 3,
                "acc_key": "3_bank_iran",
                "amount": 250000,
                "status": "approved",
                "admin_receipt_url": "/uploads/receipts/paya_pasargad_001.jpg",
                "admin_notes": "شماره ارجاع ساتنا: 77123984",
                "days_ago": 5,
            },
            {
                "user_idx": 4,
                "acc_key": "4_bank_iran",
                "amount": 150000,
                "status": "pending",
                "admin_receipt_url": None,
                "admin_notes": "بررسی اولیه توسط سیستم انجام شد.",
                "days_ago": 2,
            },
        ]

        for w in withdrawals_data:
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
            existing_w = res.scalar_one_or_none()

            if not existing_w:
                req = WithdrawalRequest(
                    user_id=user.id,
                    settlement_account_id=acc.id,
                    amount_toman=w["amount"],
                    status=w["status"],
                    admin_receipt_url=w["admin_receipt_url"],
                    admin_notes=w["admin_notes"],
                    created_at=now - timedelta(days=w["days_ago"]),
                    processed_at=now - timedelta(days=w["days_ago"] - 1) if w["status"] == "approved" else None,
                )
                session.add(req)

        await session.commit()
        print("  ✓ Withdrawal requests seeded successfully.")

        # ---------------------------------------------------------------------
        # 7. Seed Discount Codes & User Discounts
        # ---------------------------------------------------------------------
        print("\n[7/11] Seeding Discount Codes & User Discounts...")
        discount_codes_data = [
            {
                "code": "DRGAME2026",
                "percent": 20,
                "max_toman": 500000,
                "fixed_toman": 0,
                "limit": 500,
                "used": 42,
            },
            {
                "code": "NOROOZ1404",
                "percent": 30,
                "max_toman": 1000000,
                "fixed_toman": 0,
                "limit": 200,
                "used": 18,
            },
            {
                "code": "VIPGOLD",
                "percent": 15,
                "max_toman": 450000,
                "fixed_toman": 0,
                "limit": 1000,
                "used": 85,
            },
            {
                "code": "GAMER50",
                "percent": 50,
                "max_toman": 1500000,
                "fixed_toman": 0,
                "limit": 50,
                "used": 12,
            },
            {
                "code": "WELCOME25",
                "percent": 25,
                "max_toman": 300000,
                "fixed_toman": 0,
                "limit": 1000,
                "used": 143,
            },
            {
                "code": "SPECIAL200",
                "percent": 0,
                "max_toman": None,
                "fixed_toman": 200000,
                "limit": 100,
                "used": 9,
            },
        ]

        for dc in discount_codes_data:
            stmt = select(DiscountCode).where(DiscountCode.code == dc["code"])
            res = await session.execute(stmt)
            existing_dc = res.scalar_one_or_none()

            if not existing_dc:
                session.add(DiscountCode(
                    code=dc["code"],
                    discount_percent=dc["percent"],
                    max_discount_toman=dc["max_toman"],
                    fixed_discount_toman=dc["fixed_toman"],
                    usage_limit=dc["limit"],
                    used_count=dc["used"],
                    expires_at=now + timedelta(days=90),
                    is_active=True,
                ))

        # Personal loyalty discounts for selected active users
        for u_idx in [1, 2, 6]:
            user = user_map[u_idx]
            ud_stmt = select(UserDiscount).where(
                UserDiscount.user_id == user.id,
                UserDiscount.title == "تخفیف وفاداری ۳۰ درصدی دکتر گیم",
            )
            res = await session.execute(ud_stmt)
            if not res.scalar_one_or_none():
                session.add(UserDiscount(
                    user_id=user.id,
                    title="تخفیف وفاداری ۳۰ درصدی دکتر گیم",
                    discount_percent=30,
                    max_discount_toman=900000,
                    applicable_tier_codes=["gold", "silver"],
                    starts_at=now - timedelta(days=5),
                    expires_at=now + timedelta(days=60),
                    is_used=False,
                    is_active=True,
                ))

        await session.commit()
        print("  ✓ Discount codes and personalized discounts seeded successfully.")

        # ---------------------------------------------------------------------
        # 8. Seed Game Download Files for Existing Games
        # ---------------------------------------------------------------------
        print("\n[8/11] Seeding Game Download Files (Official Data, Subtitles, Dubbing, DLC, Cheats)...")
        games_res = await session.execute(select(Game).where(Game.is_active == True))
        games = games_res.scalars().all()
        print(f"  Found {len(games)} existing games in catalog.")

        download_files_created = 0
        all_game_files: list[GameDownloadFile] = []

        for g in games:
            # Check existing files for this game
            f_stmt = select(GameDownloadFile).where(GameDownloadFile.game_id == g.id)
            f_res = await session.execute(f_stmt)
            existing_files = {f.file_type: f for f in f_res.scalars().all()}

            files_spec = [
                {
                    "type": "data",
                    "title": f"دیتای اصلی بازی {g.title_fa} (نسخه کامل Official PKG)",
                    "size_gb": g.download_size_gb or 42.0,
                    "url": f"https://dl.drgame.local/games/{g.slug}/data.pkg",
                    "version": "v1.00",
                    "tiers": ["gold", "silver", "bronze"],
                },
                {
                    "type": "dlc",
                    "title": f"بسته‌های الحاقی و DLC های داستانی {g.title_fa}",
                    "size_gb": 8.5,
                    "url": f"https://dl.drgame.local/games/{g.slug}/dlc_pack.pkg",
                    "version": "v1.02",
                    "tiers": ["gold", "silver"],
                },
                {
                    "type": "subtitle",
                    "title": f"زیرنویس فارسی اختصاصی دکتر گیم (ترجمه رسمی استودیو)",
                    "size_gb": 0.25,
                    "url": f"https://dl.drgame.local/games/{g.slug}/subtitles_fa.pkg",
                    "version": "v2.0",
                    "tiers": ["gold", "silver", "bronze"],
                },
                {
                    "type": "dubbing",
                    "title": f"دوبله فارسی حرفه‌ای و بدون سانسور دکتر گیم",
                    "size_gb": 3.8,
                    "url": f"https://dl.drgame.local/games/{g.slug}/dubbing_fa.pkg",
                    "version": "v1.1",
                    "tiers": ["gold"],
                },
                {
                    "type": "cheat",
                    "title": f"ترینر، سیو ۱۰۰٪ و پکیج چیت کدها (GoldHEN Trainer)",
                    "size_gb": 0.05,
                    "url": f"https://dl.drgame.local/games/{g.slug}/cheats.pkg",
                    "version": "v1.0",
                    "tiers": ["gold", "silver"],
                },
            ]

            for fs in files_spec:
                if fs["type"] not in existing_files:
                    new_file = GameDownloadFile(
                        game_id=g.id,
                        file_type=fs["type"],
                        title=fs["title"],
                        file_size_gb=fs["size_gb"],
                        size_bytes=int(fs["size_gb"] * 1024 * 1024 * 1024),
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
        print(f"  ✓ Added {download_files_created} download files across catalog games.")

        # ---------------------------------------------------------------------
        # 9. Seed User Download History & Quota Consumption Logs
        # ---------------------------------------------------------------------
        print("\n[9/11] Seeding User Download History and Quota Deductions...")
        downloads_seeded = 0

        if all_game_files:
            # Let selected active users have download histories
            history_specs = [
                (1, 0, 10),  # User 1 downloaded first file 10 days ago
                (1, 1, 9),
                (1, 2, 8),
                (2, 0, 12),
                (2, 3, 11),
                (3, 0, 14),
                (4, 0, 7),
                (4, 2, 6),
                (5, 0, 5),
                (6, 0, 13),
                (6, 1, 12),
                (8, 0, 4),
                (9, 0, 3),
                (10, 0, 2),
                (12, 0, 8),
                (15, 0, 1),
            ]

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

                        session.add(QuotaConsumptionLog(
                            user_id=user.id,
                            game_id=target_file.game_id,
                            bytes_downloaded=target_file.size_bytes or int(target_file.file_size_gb * 1024**3),
                            gb_deducted=target_file.file_size_gb,
                            download_server_id="cdn-tehran-core01",
                            created_at=now - timedelta(days=days_ago),
                        ))
                        downloads_seeded += 1

            await session.commit()
        print(f"  ✓ Seeded {downloads_seeded} realistic download history audit records.")

        # ---------------------------------------------------------------------
        # 10. Seed Realistic Support Tickets & Threaded Discussions
        # ---------------------------------------------------------------------
        print("\n[10/11] Seeding Realistic Support Tickets with Threaded Messages...")
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
                    ("admin", "پشتیبانی فنی دکتر گیم", "درود بر شما کاربر گرامی. نسخه قرار گرفته روی سرورهای دکتر گیم به صورت اتوماتیک بک‌پورت شده و با فریمور 9.00 به بالا کاملاً سازگار است. نیازی به نصب پچ مجزا ندارید و پس از انتقال از طریق فلش یا هارد با فرمت exFAT می‌توانید مستقیم نصب نمایید."),
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
                    ("user", "سارا علیزاده", "سلام، من روز شنبه درخواست تسویه حساب ۴۰۰ هزار تومانی ثبت کردم. هنوز پیامک واریز از بانک سامان دریافت نکردم. میشه لطفاً شماره پیگیری پایا رو بفرمایید؟"),
                    ("admin", "امور مالی دکتر گیم", "با سلام و احترام سرکار خانم علیزاده. درخواست تسویه شما در چرخه پایا ساعت ۱۳:۴۵ ثبت و رسید آن در بخش تاریخچه تسویه حساب پیوست شد. شماره پیگیری شاپرک: 894321074. با تشکر."),
                    ("user", "سارا علیزاده", "سلام، رسید رو دیدم و مبلغ هم به حساب نشست. ممنون از پیگیری سریع شما."),
                ],
            },
            {
                "user_idx": 3,
                "subject": "کندی سرعت دانلود در ساعات اوج مصرف اینترنت مخابرات",
                "dept": "downloads",
                "priority": "medium",
                "status": "answered",
                "days_ago": 4,
                "messages": [
                    ("user", "علی رضایی", "سلام. من اینترنت فیبر مخابرات دارم ولی از ساعت ۸ شب تا ۱۱ شب سرعت دانلودم از ۵۰ مگابیت به ۸ مگابیت افت پیدا میکنه. آیا سرور دانلود جایگزین دارید؟"),
                    ("admin", "پشتیبانی فنی دکتر گیم", "سلام وقت بخیر. سرور شماره ۲ دکتر گیم (CDN شیراز) به صورت مستقیم با شبکه زیرساخت لینک است. شما می‌توانید از بخش پروفایل کاربری، سرور اختصاصی را روی شیراز تنظیم نمایید."),
                ],
            },
            {
                "user_idx": 4,
                "subject": "درخواست افزودن نسخه فارسی بازی The Last of Us Part 1",
                "dept": "general",
                "priority": "normal",
                "status": "open",
                "days_ago": 1,
                "messages": [
                    ("user", "رضا کریمی", "با سلام و خسته نباشید. میخواستم بدونم آیا دوبله یا زیرنویس فارسی بازی The Last of Us Part 1 برای PS5 به زودی به کاتالوگ اضافه میشه؟ ممنون میشم در برنامه قرار بدید."),
                ],
            },
            {
                "user_idx": 5,
                "subject": "سوال درباره نحوه محاسبه کمیسیون رفرال سطح ۲ و ۳",
                "dept": "financial",
                "priority": "normal",
                "status": "answered",
                "days_ago": 5,
                "messages": [
                    ("user", "مهدی احمدی", "سلام. دوست من با کد معرف من عضو شد و خودش هم ۲ نفر رو دعوت کرد. پورسانت خریدهای اون دو نفر چطور به کیف پول من اضافه میشه؟"),
                    ("admin", "امور مشتریان دکتر گیم", "درود بر شما. در ساختار چند سطحی دکتر گیم، شما از خریدهای مستقیم سطح یک ۵۰٪، از افراد دعوت شده توسط آنها (سطح ۲) ۲۵٪ و از سطح سه ۱۲.۵٪ سهم صندوق پورسانت را به شکل آنی دریافت می‌کنید."),
                ],
            },
            {
                "user_idx": 6,
                "subject": "خطای CE-108255-1 هنگام اجرای دیتای بازی روی کنسول PS5",
                "dept": "technical",
                "priority": "urgent",
                "status": "open",
                "days_ago": 2,
                "messages": [
                    ("user", "فاطمه مرادی", "سلام. بعد از دانلود و نصب کامل دیتای بازی بر روی پلی استیشن ۵، هنگام ورود به بازی با خطای CE-108255-1 مواجه میشم. دیتابیس رو Rebuild کردم حل نشد. چاره چیه؟"),
                ],
            },
            {
                "user_idx": 8,
                "subject": "تایید آدرس کیف پول تتر TRC20 برای تسویه ریالی و ارزی",
                "dept": "financial",
                "priority": "normal",
                "status": "closed",
                "days_ago": 8,
                "messages": [
                    ("user", "کیان اکبری", "سلام، آدرس ولت تتر خودم رو در بخش حساب‌های تسویه ثبت کردم. بررسی و تایید آن چقدر زمان می‌بره؟"),
                    ("admin", "امور مالی دکتر گیم", "سلام و احترام. حساب رمزارز شما توسط واحد مالی تایید و فعال شد. هم‌اکنون می‌توانید درخواست‌های تسویه خود را با معادل تتر ثبت نمایید."),
                ],
            },
            {
                "user_idx": 10,
                "subject": "روش فعال‌سازی دوبله فارسی اختصاصی روی کنسول جیلبریک شده",
                "dept": "technical",
                "priority": "normal",
                "status": "answered",
                "days_ago": 3,
                "messages": [
                    ("user", "آرمین ابراهیمی", "سلام. فایل دوبله فارسی رو دانلود کردم. باید بعد از آپدیت بازی نصب بشه یا قبل از اون؟"),
                    ("admin", "پشتیبانی فنی دکتر گیم", "سلام. ترتیب صحیح نصب: ابتدا دیتای پایه بازی (Base PKG)، سپس آخرین آپدیت و در نهایت پکیج دوبله فارسی اختصاصی دکتر گیم را نصب فرمایید."),
                ],
            },
            {
                "user_idx": 12,
                "subject": "نحوه انتقال حجم باقی‌مانده اشتراک قبلی به دوره جدید",
                "dept": "general",
                "priority": "low",
                "status": "closed",
                "days_ago": 10,
                "messages": [
                    ("user", "مریم شجاعی", "سلام وقت بخیر. آیا با تمدید اشتراک طلایی قبل از انقضا، حجم مصرف نشده من به دوره بعد منتقل میشه؟"),
                    ("admin", "پشتیبانی دکتر گیم", "سلام. بله، در صورت تمدید پیش از تاریخ انقضا، مانده حجم دوره قبلی به صورت اتوماتیک به حجم دوره جدید شما اضافه (Rollover) می‌گردد."),
                ],
            },
            {
                "user_idx": 15,
                "subject": "مشکل در درگاه بانکی هنگام خرید اشتراک طلایی",
                "dept": "financial",
                "priority": "urgent",
                "status": "answered",
                "days_ago": 1,
                "messages": [
                    ("user", "دانیال فرهمند", "سلام. موقع پرداخت مبلغ از حسابم کسر شد اما تو سایت هنوز وضعیت در انتظار تایید هست."),
                    ("admin", "امور مالی دکتر گیم", "با سلام. تراکنش شاپرک بررسی و تایید گردید. اشتراک طلایی شما به مدت ۳۰ روز و حجم ۲۲۰۰ گیگابایت با موفقیت روی حساب کاربری شما فعال شد."),
                ],
            },
        ]

        tickets_seeded = 0
        for td in tickets_data:
            user = user_map[td["user_idx"]]
            t_stmt = select(Ticket).where(
                Ticket.user_id == user.id,
                Ticket.subject == td["subject"],
            )
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
                tickets_seeded += 1

                # Add threaded messages
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
        print(f"  ✓ Seeded {tickets_seeded} tickets with threaded conversations.")

        # ---------------------------------------------------------------------
        # 11. Seed In-App User Notifications & Registered Device Telemetry
        # ---------------------------------------------------------------------
        print("\n[11/11] Seeding In-App Notifications and Console Hardware Telemetry...")
        notifications_data = [
            (1, "خوش‌آمدید به جمع طلایی‌های دکتر گیم!", "اشتراک VIP طلایی شما به مدت ۳۰ روز و حجم ۲۲۰۰ گیگابایت فعال شد. از سرعت نامحدود لذت ببرید.", "system", True, 15),
            (1, "واریز پورسانت رفرال سطح ۱", "مبلغ ۱۵۰,۰۰۰ تومان از خرید اشتراک طلایی توسط سارا علیزاده به کیف پول شما واریز شد.", "commission", True, 10),
            (1, "واریز تسویه حساب بانکی", "مبلغ ۱,۰۰۰,۰۰۰ تومان از طریق پایا به شماره شبا بانک ملت شما واریز گردید.", "system", True, 8),
            (2, "خوش‌آمدید به خانواده دکتر گیم!", "اشتراک طلایی شما فعال شد. دسترسی به تمام عناوین رسمی و زیرنویس فارسی برای شما فراهم است.", "system", True, 14),
            (2, "پاسخ جدید به تیکت پشتیبانی", "کارشناس امور مالی دکتر گیم به تیکت «استعلام واریز تسویه حساب» پاسخ داد.", "ticket_reply", False, 7),
            (3, "یادآوری حجم مصرفی", "هشدار: شما بیش از ۵۰٪ از حجم مجاز اشتراک طلایی خود را مصرف کرده‌اید.", "quota_reminder", False, 3),
            (4, "تخفیف ویژه بهاره برای شما!", "کد تخفیف ۲۰ درصدی DRGAME2026 برای تمدید اشتراک شما فعال شد.", "system", True, 5),
            (6, "دریافت پورسانت سطح ۲", "مبلغ ۷۵,۰۰۰ تومان پورسانت معرف از خرید اشتراک زیرمجموعه به کیف پول شما افزوده شد.", "commission", False, 2),
            (8, "تایید حساب رمزارز", "آدرس کیف پول تتر TRC20 شما تایید و فعال شد.", "system", True, 6),
            (15, "تمدید موفق اشتراک طلایی", "پرداخت شما با موفقیت ثبت شد و حجم دانلود شما شارژ گردید.", "system", False, 1),
        ]

        for u_idx, title, msg, n_type, is_read, days_ago in notifications_data:
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
            (1, "JKT-PS5-AMIR-001", "PS5 Digital Edition (CFI-1200)", 825 * 1024**3, 412 * 1024**3),
            (2, "JKT-PS4-SARA-002", "PS4 Pro 1TB (CUH-7200)", 1000 * 1024**3, 230 * 1024**3),
            (3, "JKT-PS5-ALI-003", "PS5 Disc Edition (CFI-1100)", 825 * 1024**3, 580 * 1024**3),
            (4, "JKT-PS4-REZA-004", "PS4 Slim 500GB (CUH-2200)", 500 * 1024**3, 115 * 1024**3),
            (6, "JKT-PS5-FATEMEH-005", "PS5 Slim 1TB", 1000 * 1024**3, 620 * 1024**3),
        ]

        for u_idx, jkt, dev_name, total_b, free_b in devices_data:
            user = user_map[u_idx]
            d_stmt = select(RegisteredDevice).where(RegisteredDevice.jkt == jkt)
            res = await session.execute(d_stmt)
            dev = res.scalar_one_or_none()

            mock_jwk = {
                "kty": "RSA",
                "n": "v1q94w_M7xL5k2...demo_jwk_key",
                "e": "AQAB",
                "kid": jkt,
            }

            if not dev:
                session.add(RegisteredDevice(
                    jkt=jkt,
                    user_id=user.id,
                    device_name=dev_name,
                    public_jwk=mock_jwk,
                    created_at=now - timedelta(days=25),
                    last_seen_at=now - timedelta(hours=2),
                ))

            # Storage report
            sr_stmt = select(DeviceStorageReport).where(DeviceStorageReport.jwk_thumbprint == jkt)
            res = await session.execute(sr_stmt)
            report = res.scalar_one_or_none()

            if not report:
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
    print("✅ All Platform Demo Data Successfully Seeded!")
    print("   - 20 Persian Customer Users (09000000001 - 09000000020)")
    print("   - Multi-Tier Referral Tree & Commissions")
    print("   - Active Subscriptions (Gold, Silver, Bronze, Free)")
    print("   - Payments, Wallets, Settlement Accounts & Payout Requests")
    print("   - 5-Type Download Files for all Catalog Games & Download Histories")
    print("   - Threaded Support Tickets & Notifications")
    print("   - PS4/PS5 Hardware Device Storage Telemetry")
    print("=================================================================\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
