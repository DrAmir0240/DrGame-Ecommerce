"""Admin services: authentication, user management, manual quota adjustment, finance monitoring, and payouts."""
from datetime import datetime, timezone
from sqlalchemy import select, func, desc, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, BadRequestException, AuthenticationError
from app.core.admin_dependencies import create_admin_token
from app.modules.auth.admin_models import AdminUser
from app.modules.users.models import User
from app.modules.quota.models import UserQuota, QuotaConsumptionLog
from app.modules.quota.services import QuotaService
from app.modules.subscriptions.models import OrderPayment, UserSubscription, FreeTierAllowedGame, SubscriptionTier, DiscountCode
from app.modules.wallet.models import UserWallet, SettlementAccount, WithdrawalRequest, ReferralChain
from app.modules.games.models import Game, GameDownloadLink


class AdminService:
    @staticmethod
    async def seed_superadmin(db: AsyncSession) -> AdminUser:
        """Seed initial superadmin if table is empty."""
        stmt = select(AdminUser).limit(1)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if not existing:
            admin = AdminUser(
                username="admin",
                email="admin@drgame.ir",
                password_hash=hash_password("DrGame@Admin2026!"),
                role="superadmin",
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            return admin
        return existing

    @classmethod
    async def login(cls, db: AsyncSession, username_or_email: str, password: str) -> dict:
        """Authenticate admin user and issue admin token."""
        await cls.seed_superadmin(db)

        stmt = select(AdminUser).where(
            or_(
                AdminUser.username == username_or_email.strip(),
                AdminUser.email == username_or_email.strip().lower(),
            )
        )
        admin = (await db.execute(stmt)).scalar_one_or_none()

        if not admin or not verify_password(password, admin.password_hash):
            raise AuthenticationError("نام کاربری یا کلمه عبور مدیر اشتباه است.")

        if not admin.is_active:
            raise BadRequestException("حساب مدیریت غیرفعال شده است.")

        token, jti, exp = create_admin_token(admin.id, admin.username, admin.role)

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": int(exp.timestamp()),
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
            },
        }

    @staticmethod
    async def list_users(
        db: AsyncSession,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """Retrieve paginated user list with quotas."""
        stmt = select(User)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    User.full_name.ilike(term),
                    User.username.ilike(term),
                    User.phone.ilike(term),
                    User.email.ilike(term),
                )
            )

        count_stmt = select(func.count(User.id))
        if search and search.strip():
            term = f"%{search.strip()}%"
            count_stmt = count_stmt.where(
                or_(
                    User.full_name.ilike(term),
                    User.username.ilike(term),
                    User.phone.ilike(term),
                    User.email.ilike(term),
                )
            )
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size)
        users = (await db.execute(stmt)).scalars().all()

        user_items = []
        for u in users:
            quota_stmt = select(UserQuota).where(UserQuota.user_id == u.id)
            quota = (await db.execute(quota_stmt)).scalar_one_or_none()

            user_items.append({
                "id": u.id,
                "full_name": u.full_name,
                "username": u.username,
                "phone": u.phone,
                "email": u.email,
                "referral_code": u.referral_code,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "total_quota_gb": quota.total_quota_gb if quota else 5.0,
                "used_quota_gb": quota.used_quota_gb if quota else 0.0,
            })

        return {
            "items": user_items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def get_user_dossier(db: AsyncSession, user_id: int) -> dict:
        """Fetch comprehensive dossier of a single user."""
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر یافت نشد.")

        quota = (await db.execute(select(UserQuota).where(UserQuota.user_id == user_id))).scalar_one_or_none()
        wallet = (await db.execute(select(UserWallet).where(UserWallet.user_id == user_id))).scalar_one_or_none()
        payments = (await db.execute(select(OrderPayment).where(OrderPayment.user_id == user_id).order_by(desc(OrderPayment.created_at)).limit(10))).scalars().all()

        return {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "username": user.username,
                "phone": user.phone,
                "email": user.email,
                "referral_code": user.referral_code,
                "is_active": user.is_active,
                "created_at": user.created_at,
            },
            "quota": {
                "total_gb": quota.total_quota_gb if quota else 5.0,
                "used_gb": quota.used_quota_gb if quota else 0.0,
                "remaining_gb": quota.remaining_quota_gb if quota else 5.0,
                "is_exhausted": (quota.remaining_quota_gb <= 0) if quota else False,
            },
            "wallet": {
                "withdrawable_balance_toman": wallet.withdrawable_balance_toman if wallet else 0,
                "total_earned_toman": wallet.total_earned_toman if wallet else 0,
            },
            "recent_payments": [
                {
                    "id": p.id,
                    "tier_code": p.tier_code,
                    "final_price": p.final_price,
                    "status": p.status,
                    "created_at": p.created_at,
                }
                for p in payments
            ],
        }

    @staticmethod
    async def adjust_user_quota(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        added_gb: float,
        reason: str = "شارژ دستی توسط مدیریت کلان",
    ) -> dict:
        """Manually increase or decrease a user's download quota."""
        quota_stmt = select(UserQuota).where(UserQuota.user_id == user_id)
        quota = (await db.execute(quota_stmt)).scalar_one_or_none()

        if not quota:
            total_g = max(0.0, 5.0 + added_gb)
            quota = UserQuota(
                user_id=user_id,
                total_quota_gb=total_g,
                used_quota_gb=0.0,
                remaining_quota_gb=total_g,
            )
            db.add(quota)
        else:
            quota.total_quota_gb = max(0.0, quota.total_quota_gb + added_gb)
            quota.remaining_quota_gb = max(0.0, quota.total_quota_gb - quota.used_quota_gb)

        # Invalidate cache
        try:
            await redis.delete(f"drgame:user:{user_id}:quota")
        except Exception:
            pass

        await db.commit()
        await db.refresh(quota)

        return {
            "status": "success",
            "user_id": user_id,
            "total_quota_gb": quota.total_quota_gb,
            "used_quota_gb": quota.used_quota_gb,
            "reason": reason,
        }

    @staticmethod
    async def get_finance_overview(db: AsyncSession) -> dict:
        """Read-only monitoring of domestic Tomans and global crypto transactions."""
        payments = (await db.execute(select(OrderPayment).order_by(desc(OrderPayment.created_at)).limit(50))).scalars().all()

        total_rial_toman = sum(p.final_price // 10 for p in payments if p.payment_method != "crypto_usdt")
        total_crypto_count = sum(1 for p in payments if p.payment_method == "crypto_usdt")

        return {
            "total_orders_count": len(payments),
            "total_domestic_volume_toman": total_rial_toman,
            "total_crypto_orders_count": total_crypto_count,
            "recent_transactions": [
                {
                    "id": p.id,
                    "user_id": p.user_id,
                    "tier_code": p.tier_code,
                    "amount_toman": p.final_price // 10 if p.final_price >= 10000 else p.final_price,
                    "payment_method": p.payment_method,
                    "transaction_ref": p.transaction_ref,
                    "status": p.status,
                    "created_at": p.created_at,
                }
                for p in payments
            ],
        }

    @staticmethod
    async def list_payout_requests(db: AsyncSession, status: str | None = None) -> list[dict]:
        """List referral payout requests with user and settlement account details."""
        stmt = select(WithdrawalRequest, User.full_name, User.phone, SettlementAccount).join(
            User, WithdrawalRequest.user_id == User.id
        ).join(
            SettlementAccount, WithdrawalRequest.settlement_account_id == SettlementAccount.id
        )

        if status:
            stmt = stmt.where(WithdrawalRequest.status == status)

        stmt = stmt.order_by(desc(WithdrawalRequest.created_at))
        rows = (await db.execute(stmt)).all()

        items = []
        for req, full_name, phone, acc in rows:
            items.append({
                "id": req.id,
                "user_id": req.user_id,
                "user_name": full_name,
                "user_phone": phone,
                "amount_toman": req.amount_toman,
                "status": req.status,
                "account_type": acc.account_type,
                "sheba_number": acc.sheba_number,
                "card_number": acc.card_number,
                "crypto_wallet_address": acc.crypto_wallet_address,
                "crypto_network": acc.crypto_network,
                "created_at": req.created_at,
            })
        return items

    @staticmethod
    async def process_payout_request(
        db: AsyncSession, request_id: int, new_status: str, admin_receipt_url: str | None = None, admin_notes: str | None = None
    ) -> dict:
        """Approve or reject a withdrawal request. If rejected, refund the wallet."""
        stmt = select(WithdrawalRequest).where(WithdrawalRequest.id == request_id)
        req = (await db.execute(stmt)).scalar_one_or_none()
        if not req:
            raise NotFoundException("درخواست برداشت یافت نشد.")

        if req.status != "pending":
            raise BadRequestException("این درخواست قبلاً پردازش شده است.")

        req.status = new_status
        req.admin_receipt_url = admin_receipt_url
        req.admin_notes = admin_notes
        req.processed_at = datetime.now(timezone.utc)

        # If rejected, refund balance to user wallet
        if new_status == "rejected":
            wallet_stmt = select(UserWallet).where(UserWallet.user_id == req.user_id)
            wallet = (await db.execute(wallet_stmt)).scalar_one_or_none()
            if wallet:
                wallet.withdrawable_balance_toman += req.amount_toman
                wallet.total_withdrawn_toman = max(0, wallet.total_withdrawn_toman - req.amount_toman)

        await db.commit()
        await db.refresh(req)

        return {
            "id": req.id,
            "status": req.status,
            "processed_at": req.processed_at,
        }

    @staticmethod
    async def verify_settlement_account(db: AsyncSession, account_id: int, is_verified: bool) -> dict:
        """Approve or reject a user settlement account."""
        stmt = select(SettlementAccount).where(SettlementAccount.id == account_id)
        acc = (await db.execute(stmt)).scalar_one_or_none()
        if not acc:
            raise NotFoundException("حساب تسویه یافت نشد.")

        acc.is_verified = is_verified
        await db.commit()
        await db.refresh(acc)

        return {"id": acc.id, "is_verified": acc.is_verified}

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> dict:
        """Overview KPIs for admin dashboard."""
        total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
        active_subs = (await db.execute(
            select(func.count(UserSubscription.id)).where(UserSubscription.status == "active")
        )).scalar() or 0
        total_games = (await db.execute(select(func.count(Game.id)))).scalar() or 0
        pending_payouts = (await db.execute(
            select(func.count(WithdrawalRequest.id)).where(WithdrawalRequest.status == "pending")
        )).scalar() or 0
        total_payments = (await db.execute(
            select(func.sum(OrderPayment.final_price)).where(OrderPayment.status == "success")
        )).scalar() or 0

        return {
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "total_games": total_games,
            "pending_payouts": pending_payouts,
            "total_revenue_toman": int(total_payments // 10) if total_payments >= 10000 else int(total_payments),
        }

    @staticmethod
    async def list_games(db: AsyncSession, search: str | None = None, page: int = 1, page_size: int = 20) -> dict:
        """List games with search and pagination for admin."""
        stmt = select(Game)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(or_(Game.title_fa.ilike(term), Game.title_en.ilike(term)))

        count_stmt = select(func.count(Game.id))
        if search and search.strip():
            term = f"%{search.strip()}%"
            count_stmt = count_stmt.where(or_(Game.title_fa.ilike(term), Game.title_en.ilike(term)))
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Game.id)).offset((page - 1) * page_size).limit(page_size)
        games = (await db.execute(stmt)).scalars().all()

        return {
            "items": games,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def create_game(db: AsyncSession, data: dict) -> Game:
        """Create a new game in catalog with local image storage and download links."""
        import random
        from app.core.storage import download_and_save_image
        rawg_id = data.get("rawg_id") or random.randint(100000, 999999)
        slug = data.get("slug") or data["title_en"].lower().replace(" ", "-")

        cover_image = data.get("cover_image_url")
        banner_image = data.get("banner_image_url") or cover_image

        if cover_image and cover_image.startswith("http"):
            cover_image = await download_and_save_image(cover_image, prefix="cover")
        if banner_image and banner_image.startswith("http"):
            banner_image = await download_and_save_image(banner_image, prefix="banner")

        download_links_data = data.pop("download_links", None)

        game = Game(
            rawg_id=rawg_id,
            title_fa=data["title_fa"],
            title_en=data["title_en"],
            slug=slug,
            description_fa=data.get("description_fa"),
            description_en=data.get("description_en"),
            storyline_fa=data.get("storyline_fa"),
            developer=data.get("developer"),
            publisher=data.get("publisher"),
            awards=data.get("awards", []),
            screenshots=data.get("screenshots", []),
            released=data.get("released"),
            rating=data.get("rating", 0.0),
            metacritic=data.get("metacritic"),
            download_size_gb=data.get("download_size_gb", 0.0),
            is_two_player=data.get("is_two_player", False),
            has_vr=data.get("has_vr", False),
            platforms=data.get("platforms", ["PS5", "PS4"]),
            genres=data.get("genres", ["Action"]),
            cover_image_url=cover_image,
            banner_image_url=banner_image,
            is_active=data.get("is_active", True),
        )
        db.add(game)
        await db.commit()
        await db.refresh(game)

        if download_links_data:
            for idx, item in enumerate(download_links_data):
                if isinstance(item, dict):
                    link = GameDownloadLink(
                        game_id=game.id,
                        part_number=item.get("part_number", idx + 1),
                        part_name=item.get("part_name", f"پارت {idx + 1}"),
                        file_size_gb=float(item.get("file_size_gb", 0.0)),
                        download_url=item.get("download_url", ""),
                        is_active=item.get("is_active", True),
                    )
                    db.add(link)
            await db.commit()

        return game

    @staticmethod
    async def get_game(db: AsyncSession, game_id: int) -> dict:
        """Get single game details for admin edit including all fields and download links."""
        game = (await db.execute(select(Game).where(Game.id == game_id))).scalar_one_or_none()
        if not game:
            raise NotFoundException("بازی یافت نشد.")

        links = (await db.execute(
            select(GameDownloadLink).where(GameDownloadLink.game_id == game_id).order_by(GameDownloadLink.part_number.asc())
        )).scalars().all()

        return {
            "id": game.id,
            "rawg_id": game.rawg_id,
            "title_fa": game.title_fa,
            "title_en": game.title_en,
            "slug": game.slug,
            "description_fa": game.description_fa or "",
            "description_en": game.description_en or "",
            "storyline_fa": game.storyline_fa or "",
            "developer": game.developer or "",
            "publisher": game.publisher or "",
            "awards": game.awards or [],
            "screenshots": game.screenshots or [],
            "released": game.released or "",
            "rating": game.rating,
            "metacritic": game.metacritic,
            "download_size_gb": game.download_size_gb,
            "is_two_player": game.is_two_player,
            "has_vr": game.has_vr,
            "platforms": game.platforms or [],
            "genres": game.genres or [],
            "cover_image_url": game.cover_image_url or "",
            "banner_image_url": game.banner_image_url or "",
            "is_active": game.is_active,
            "likes_count": game.likes_count,
            "dislikes_count": game.dislikes_count,
            "wishlist_count": game.wishlist_count,
            "download_links": [
                {
                    "id": l.id,
                    "part_number": l.part_number,
                    "part_name": l.part_name,
                    "file_size_gb": l.file_size_gb,
                    "download_url": l.download_url,
                    "is_active": l.is_active,
                }
                for l in links
            ],
        }

    @staticmethod
    async def update_game(db: AsyncSession, game_id: int, data: dict) -> Game:
        """Update existing game catalog entry and localize images if remote."""
        from app.core.storage import download_and_save_image
        game = (await db.execute(select(Game).where(Game.id == game_id))).scalar_one_or_none()
        if not game:
            raise NotFoundException("بازی یافت نشد.")

        if "cover_image_url" in data and data["cover_image_url"] and data["cover_image_url"].startswith("http"):
            data["cover_image_url"] = await download_and_save_image(data["cover_image_url"], prefix="cover")
        if "banner_image_url" in data and data["banner_image_url"] and data["banner_image_url"].startswith("http"):
            data["banner_image_url"] = await download_and_save_image(data["banner_image_url"], prefix="banner")

        download_links_data = data.pop("download_links", None)

        for k, v in data.items():
            if hasattr(game, k) and v is not None:
                setattr(game, k, v)

        if download_links_data is not None:
            await db.execute(delete(GameDownloadLink).where(GameDownloadLink.game_id == game_id))
            for idx, item in enumerate(download_links_data):
                if isinstance(item, dict):
                    link = GameDownloadLink(
                        game_id=game.id,
                        part_number=item.get("part_number", idx + 1),
                        part_name=item.get("part_name", f"پارت {idx + 1}"),
                        file_size_gb=float(item.get("file_size_gb", 0.0)),
                        download_url=item.get("download_url", ""),
                        is_active=item.get("is_active", True),
                    )
                    db.add(link)

        await db.commit()
        await db.refresh(game)
        return game


    @staticmethod
    async def delete_game(db: AsyncSession, game_id: int) -> dict:
        """Delete game from catalog."""
        game = (await db.execute(select(Game).where(Game.id == game_id))).scalar_one_or_none()
        if not game:
            raise NotFoundException("بازی یافت نشد.")

        await db.delete(game)
        await db.commit()
        return {"status": "deleted", "id": game_id}

    @staticmethod
    async def list_free_tier_games(db: AsyncSession) -> list[dict]:
        """List games allowed in free tier subscription."""
        stmt = select(FreeTierAllowedGame, Game).join(Game, FreeTierAllowedGame.game_id == Game.id)
        rows = (await db.execute(stmt)).all()
        return [
            {
                "id": fg.id,
                "game_id": g.id,
                "title_fa": g.title_fa,
                "title_en": g.title_en,
                "cover_image_url": g.cover_image_url,
                "is_active": fg.is_active,
                "added_at": fg.added_at,
            }
            for fg, g in rows
        ]

    @staticmethod
    async def set_free_tier_games(db: AsyncSession, game_ids: list[int]) -> list[int]:
        """Update the list of allowed free tier games (up to 5)."""
        # Deactivate or delete old
        await db.execute(select(FreeTierAllowedGame))
        old_entries = (await db.execute(select(FreeTierAllowedGame))).scalars().all()
        for e in old_entries:
            await db.delete(e)

        for gid in game_ids[:5]:
            db.add(FreeTierAllowedGame(game_id=gid, is_active=True))

        await db.commit()
        return game_ids[:5]

    @staticmethod
    async def list_discount_codes(db: AsyncSession) -> list[DiscountCode]:
        """List all discount codes."""
        stmt = select(DiscountCode).order_by(desc(DiscountCode.id))
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def create_discount_code(db: AsyncSession, data: dict) -> DiscountCode:
        """Create a new promotional discount coupon."""
        clean_code = data["code"].strip().upper()
        existing = (await db.execute(select(DiscountCode).where(DiscountCode.code == clean_code))).scalar_one_or_none()
        if existing:
            raise BadRequestException("کد تخفیف با این عنوان قبلاً ایجاد شده است.")

        discount = DiscountCode(
            code=clean_code,
            discount_percent=data.get("discount_percent", 0),
            max_discount_toman=data.get("max_discount_toman"),
            fixed_discount_toman=data.get("fixed_discount_toman", 0),
            usage_limit=data.get("usage_limit", 100),
            used_count=0,
            expires_at=data.get("expires_at"),
            is_active=data.get("is_active", True),
        )
        db.add(discount)
        await db.commit()
        await db.refresh(discount)
        return discount

    @staticmethod
    async def delete_discount_code(db: AsyncSession, code_id: int) -> dict:
        """Delete a discount code."""
        code = (await db.execute(select(DiscountCode).where(DiscountCode.id == code_id))).scalar_one_or_none()
        if not code:
            raise NotFoundException("کد تخفیف یافت نشد.")
        await db.delete(code)
        await db.commit()
        return {"status": "deleted", "id": code_id}

    @staticmethod
    async def list_subscriptions(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
        """List active user subscriptions."""
        stmt = select(UserSubscription, User.full_name, User.phone).join(
            User, UserSubscription.user_id == User.id
        ).order_by(desc(UserSubscription.start_date)).offset((page - 1) * page_size).limit(page_size)

        total_stmt = select(func.count(UserSubscription.id))
        total = (await db.execute(total_stmt)).scalar() or 0
        rows = (await db.execute(stmt)).all()

        items = []
        for sub, name, phone in rows:
            items.append({
                "id": sub.id,
                "user_id": sub.user_id,
                "user_name": name,
                "user_phone": phone,
                "tier_code": sub.tier_code,
                "starts_at": sub.start_date,
                "expires_at": sub.end_date,
                "is_active": sub.status == "active",
                "status": sub.status,
            })

        return {"items": items, "total": total, "page": page, "page_size": page_size}

    @staticmethod
    async def toggle_user_referral_hide(db: AsyncSession, user_id: int) -> dict:
        """Toggle is_referral_hidden flag on user for pass-through referral bypass."""
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        user.is_referral_hidden = not getattr(user, "is_referral_hidden", False)
        await db.commit()
        await db.refresh(user)
        return {
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "is_referral_hidden": user.is_referral_hidden,
        }

    @staticmethod
    async def get_treasury_summary(db: AsyncSession) -> dict:
        """Fetch platform referral treasury pool balance and audit logs."""
        from app.modules.wallet.services import WalletService
        from app.modules.wallet.treasury_models import TreasuryLog

        pool = await WalletService.get_or_create_treasury_pool(db)
        logs_stmt = select(TreasuryLog).order_by(desc(TreasuryLog.created_at)).limit(50)
        logs = list((await db.execute(logs_stmt)).scalars().all())

        return {
            "balance_toman": pool.balance_toman,
            "total_collected_toman": pool.total_collected_toman,
            "total_distributed_toman": pool.total_distributed_toman,
            "updated_at": pool.updated_at,
            "logs": [
                {
                    "id": log.id,
                    "amount_toman": log.amount_toman,
                    "action_type": log.action_type,
                    "order_id": log.order_id,
                    "description": log.description,
                    "created_at": log.created_at,
                }
                for log in logs
            ],
        }

    @staticmethod
    async def reset_treasury(
        db: AsyncSession, description: str = "صفر کردن موجودی صندوق توسط ادمین"
    ) -> dict:
        """Reset platform referral treasury pool balance to zero."""
        from app.modules.wallet.services import WalletService
        return await WalletService.admin_reset_treasury(db, description)

    @staticmethod
    async def grant_treasury_reward(
        db: AsyncSession, user_id: int, amount_toman: int, description: str = ""
    ) -> dict:
        """Award funds from platform referral treasury pool to a user wallet."""
        from app.modules.wallet.services import WalletService
        return await WalletService.admin_grant_treasury_reward(db, user_id, amount_toman, description)

    @staticmethod
    async def get_referral_overview(db: AsyncSession) -> dict:
        """Overview of referral network for admin dashboard and monitoring."""
        from app.modules.wallet.services import WalletService

        users_stmt = select(User).order_by(desc(User.created_at))
        users = list((await db.execute(users_stmt)).scalars().all())

        user_rows = []
        for u in users:
            l1_stmt = select(ReferralChain.user_id).where(ReferralChain.referrer_id == u.id)
            l1_ids = list((await db.execute(l1_stmt)).scalars().all())
            l1_count = len(l1_ids)

            l2_count = 0
            l2_ids = []
            if l1_ids:
                l2_stmt = select(ReferralChain.user_id).where(ReferralChain.referrer_id.in_(l1_ids))
                l2_ids = list((await db.execute(l2_stmt)).scalars().all())
                l2_count = len(l2_ids)

            l3_count = 0
            if l2_ids:
                l3_stmt = select(ReferralChain.user_id).where(ReferralChain.referrer_id.in_(l2_ids))
                l3_ids = list((await db.execute(l3_stmt)).scalars().all())
                l3_count = len(l3_ids)

            total_network = l1_count + l2_count + l3_count
            wallet = await WalletService.get_or_create_wallet(db, u.id)

            user_rows.append({
                "id": u.id,
                "fullName": u.full_name or u.username,
                "username": u.username,
                "phone": u.phone or "",
                "referralCode": u.referral_code or "",
                "layer1Count": l1_count,
                "layer2Count": l2_count,
                "layer3Count": l3_count,
                "totalNetworkCount": total_network,
                "totalEarnedToman": wallet.total_earned_toman,
                "balanceToman": wallet.withdrawable_balance_toman,
                "isHidden": getattr(u, "is_referral_hidden", False),
                "status": "active" if u.is_active else "suspended",
            })

        treasury_pool = await WalletService.get_or_create_treasury_pool(db)

        total_network_users = sum(r["totalNetworkCount"] for r in user_rows)
        total_commissions_earned = sum(r["totalEarnedToman"] for r in user_rows)
        total_pending_settlements = sum(r["balanceToman"] for r in user_rows)
        active_referrers = len([r for r in user_rows if r["layer1Count"] > 0])

        return {
            "users": user_rows,
            "stats": {
                "total_network_users": total_network_users,
                "total_commissions_earned": total_commissions_earned,
                "total_pending_settlements": total_pending_settlements,
                "active_referrers_count": active_referrers,
                "treasury_balance": treasury_pool.balance_toman,
                "treasury_collected": treasury_pool.total_collected_toman,
                "treasury_distributed": treasury_pool.total_distributed_toman,
            },
        }
