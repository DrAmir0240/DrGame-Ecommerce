"""Site settings database models for global dynamic configurations."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SiteSetting(Base):
    """Dynamic global settings for Header DNS, Footer contacts, Jailbreak payloads, and FAQs."""
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)

    # Header DNS & Status Bar
    header_dns_primary: Mapped[str] = mapped_column(String(50), default="165.227.83.145", nullable=False)
    header_dns_secondary: Mapped[str] = mapped_column(String(50), default="192.241.221.79", nullable=False)
    server_status_text: Mapped[str] = mapped_column(String(150), default="سرورهای دانلود و اتصال کنسول آنلاین است", nullable=False)
    server_is_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Footer Contacts & Address
    contact_phone: Mapped[str] = mapped_column(String(50), default="۰۲۱-۹۱۰۱۰۰۰۰", nullable=False)
    contact_email: Mapped[str] = mapped_column(String(100), default="support@drgame.ir", nullable=False)
    contact_address: Mapped[str] = mapped_column(String(255), default="تهران، خیابان ولیعصر، برج فناوری و بازی‌های رایانه‌ای", nullable=False)
    support_working_hours: Mapped[str] = mapped_column(String(100), default="پشتیبانی ۲۴ ساعته در ۷ روز هفته", nullable=False)

    # Social Channels
    social_telegram: Mapped[str] = mapped_column(String(150), default="https://t.me/DrGame_ir", nullable=False)
    social_instagram: Mapped[str] = mapped_column(String(150), default="https://instagram.com/DrGame_ir", nullable=False)
    social_youtube: Mapped[str] = mapped_column(String(150), default="https://youtube.com/@DrGame_ir", nullable=False)

    # Console Jailbreak Configurations (JSON)
    jailbreak_config: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "supported_firmwares": ["9.00", "9.60", "10.01", "11.00"],
            "goldhen_version": "v2.4b16.2",
            "dns_servers": ["165.227.83.145", "192.241.221.79"],
            "payloads": [
                {"name": "GoldHEN", "version": "2.4b16.2", "file": "goldhen.bin"},
                {"name": "WebRTE", "version": "1.0", "file": "webrte.bin"},
            ],
        },
        nullable=False,
    )

    # Frequently Asked Questions (JSON)
    faq_items: Mapped[list] = mapped_column(
        JSON,
        default=lambda: [
            {
                "question": "آیا بازی‌های دانلودشده برای همیشه در کنسول فعال می‌مانند؟",
                "answer": "بله، دیتای بازی‌ها و لایسنس تا زمان باقی‌ماندن روی هارد یا حافظه کنسول قابل استفاده خواهند بود.",
            },
            {
                "question": "حجم باقیمانده اشتراک در صورت تمدید به دوره بعدی منتقل می‌شود؟",
                "answer": "بله، در صورت تمدید اشتراک پیش از موعد انقضا، حجم مصرف‌نشده به سهمیه دوره جدید شما افزوده می‌شود.",
            },
            {
                "question": "سرعت سرورهای دانلود در ساعات پیک چقدر است؟",
                "answer": "سرورهای اختصاصی دانلود دکتر گیم متصل به شبکه پرسرعت داخلی (نیم‌بهاء) هستند و محدودیت سرعتی اعمال نمی‌شود.",
            },
        ],
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
