"""Identity verification service for bank accounts, national ID, phone, and test OTP."""
import random
import logging
import redis.asyncio as aioredis
from app.core.exceptions import BadRequestException
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


class IdentityService:
    OTP_EXPIRY_SECONDS = 120  # 2 minutes

    @staticmethod
    def _generate_otp() -> str:
        return f"{random.randint(100000, 999999)}"

    @classmethod
    async def send_phone_verification_otp(cls, phone: str, redis: aioredis.Redis | None = None) -> dict:
        """
        Generate and cache 6-digit OTP for phone verification.
        In test environment, the code is returned in the response and printed to logs.
        """
        if not phone or len(phone.strip()) < 10:
            raise BadRequestException("شماره تلفن همراه نامعتبر است.")

        clean_phone = phone.strip()
        code = cls._generate_otp()

        if redis is None:
            redis = await get_redis()

        cache_key = f"otp:settlement:{clean_phone}"
        await redis.set(cache_key, code, ex=cls.OTP_EXPIRY_SECONDS)

        logger.info(f"🔑 [MOCK OTP] Phone: {clean_phone} -> Code: {code} (expires in {cls.OTP_EXPIRY_SECONDS}s)")
        print(f"\n=========================================\n🔑 [DRGAME TEST OTP] Phone: {clean_phone} | Code: {code}\n=========================================\n")

        return {
            "status": "sent",
            "phone": clean_phone,
            "expires_in_seconds": cls.OTP_EXPIRY_SECONDS,
            "test_otp_code": code,
            "message": "کد تایید پیامک شد (کد تستی در فیلد test_otp_code قرار دارد)",
        }

    @classmethod
    async def verify_phone_otp(cls, phone: str, code: str, redis: aioredis.Redis | None = None) -> bool:
        """Verify the entered OTP against Redis cache."""
        if not phone or not code:
            return False

        clean_phone = phone.strip()
        clean_code = code.strip()

        if redis is None:
            redis = await get_redis()

        cache_key = f"otp:settlement:{clean_phone}"
        cached_code = await redis.get(cache_key)

        if not cached_code:
            return False

        if cached_code == clean_code:
            await redis.delete(cache_key)
            return True

        return False

    @staticmethod
    async def verify_national_identity(
        national_code: str,
        phone: str,
        iban: str | None = None,
        card_number: str | None = None,
    ) -> dict:
        """
        Mock identity verification simulating Iranian Shahkar / Central Bank matching.
        Validates basic length/format and automatically verifies matching identity.
        """
        if not national_code or len(national_code.strip()) != 10 or not national_code.strip().isdigit():
            raise BadRequestException("کد ملی ۱۰ رقمی نامعتبر است.")

        if not phone or len(phone.strip()) < 10:
            raise BadRequestException("شماره تلفن همراه نامعتبر است.")

        return {
            "verified": True,
            "provider": "mock_shahkar",
            "national_code": national_code.strip(),
            "phone": phone.strip(),
            "iban": iban.strip() if iban else None,
            "card_number": card_number.strip() if card_number else None,
            "message": "اطلاعات هویتی با سامانه شاهکار و شبکه بانکی با موفقیت تطبیق داده شد.",
        }
