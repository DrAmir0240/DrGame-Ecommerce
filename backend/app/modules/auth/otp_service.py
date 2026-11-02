"""Unified OTP dispatcher service with clean logging and future gateway integration."""
import logging
from app.core.config import settings

logger = logging.getLogger("drgame.otp")


class OTPService:
    @staticmethod
    async def dispatch_otp(target: str, code: str, mode: str | None = None) -> None:
        """
        Unified OTP dispatcher.
        Logs and prints structured OTP details to console/logs.
        In future steps, connects to SMS provider (Kavenegar / SMS.ir) or Email (Sendgrid / SMTP).
        """
        active_mode = mode or settings.DEPLOYMENT_MODE
        clean_target = target.strip()
        is_phone = not ("@" in clean_target)
        channel = "SMS (موبایل)" if is_phone else "EMAIL (ایمیل)"

        banner = (
            f"\n"
            f"╔══════════════════════════════════════════════════════════════╗\n"
            f"║                🔑 DRGAME OTP SERVICE DISPATCH                ║\n"
            f"╠══════════════════════════════════════════════════════════════╣\n"
            f"║  Target:   {clean_target:<48} ║\n"
            f"║  Channel:  {channel:<48} ║\n"
            f"║  Mode:     {active_mode:<48} ║\n"
            f"║  Code:     {code:<48} ║\n"
            f"║  TTL:      120 Seconds (2 Minutes)                           ║\n"
            f"╚══════════════════════════════════════════════════════════════╝\n"
        )
        logger.info(banner)
        print(banner, flush=True)
