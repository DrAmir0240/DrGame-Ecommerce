"""Pydantic V2 schemas for Admin management, authentication, user quotas, finance and payouts."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username_or_email: str = Field(..., description="نام کاربری یا ایمیل ادمین")
    password: str = Field(..., min_length=6, description="کلمه عبور ادمین")


class AdminInfoResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: AdminInfoResponse


class UserListItem(BaseModel):
    id: int
    full_name: Optional[str] = None
    username: str
    phone: Optional[str] = None
    email: Optional[str] = None
    referral_code: str
    is_active: bool
    created_at: datetime
    total_quota_gb: float
    used_quota_gb: float


class UserListResponse(BaseModel):
    items: list[UserListItem]
    total: int
    page: int
    page_size: int


class AdjustQuotaRequest(BaseModel):
    added_gb: float = Field(..., description="میزان حجم افزایشی یا کاهشی به گیگابایت")
    reason: Optional[str] = Field("شارژ دستی توسط مدیریت کلان", description="دلیل تغییر سهمیه")


class AdjustQuotaResponse(BaseModel):
    status: str
    user_id: int
    total_quota_gb: float
    used_quota_gb: float
    reason: str


class UserDossierResponse(BaseModel):
    user: dict[str, Any]
    quota: dict[str, Any]
    wallet: dict[str, Any]
    recent_payments: list[dict[str, Any]]


class DashboardStatsResponse(BaseModel):
    total_users: int
    active_subscriptions: int
    total_games: int
    pending_payouts: int
    total_revenue_toman: int


class FinanceOverviewResponse(BaseModel):
    total_orders_count: int
    total_domestic_volume_toman: int
    total_crypto_orders_count: int
    recent_transactions: list[dict[str, Any]]


class PayoutRequestItem(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    amount_toman: int
    status: str
    account_type: str
    sheba_number: Optional[str] = None
    card_number: Optional[str] = None
    crypto_wallet_address: Optional[str] = None
    crypto_network: Optional[str] = None
    created_at: datetime


class ProcessPayoutRequest(BaseModel):
    new_status: str = Field(..., pattern="^(approved|rejected)$", description="وضعیت جدید درخواست: approved یا rejected")
    admin_receipt_url: Optional[str] = Field(None, description="لینک یا آدرس فیش بانکی/تراکنش")
    admin_notes: Optional[str] = Field(None, description="یادداشت مدیر")


class VerifyAccountRequest(BaseModel):
    is_verified: bool = Field(..., description="تایید یا رد حساب تسویه")


class DownloadLinkPayload(BaseModel):
    id: Optional[int] = None
    part_number: int = 1
    part_name: str = "Part 1"
    file_size_gb: float = 0.0
    download_url: str = ""
    is_active: bool = True


class GameCreateRequest(BaseModel):
    title_fa: str
    title_en: str
    rawg_id: Optional[int] = None
    slug: Optional[str] = None
    description_fa: Optional[str] = None
    description_en: Optional[str] = None
    storyline_fa: Optional[str] = None
    developer: Optional[str] = None
    publisher: Optional[str] = None
    awards: Optional[list[str]] = []
    screenshots: Optional[list[str]] = []
    released: Optional[str] = None
    rating: Optional[float] = 0.0
    metacritic: Optional[int] = None
    download_size_gb: Optional[float] = 0.0
    is_two_player: Optional[bool] = False
    has_vr: Optional[bool] = False
    platforms: Optional[list[str]] = ["PS5", "PS4"]
    genres: Optional[list[str]] = ["Action"]
    cover_image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    is_active: Optional[bool] = True
    download_links: Optional[list[DownloadLinkPayload]] = None


class GameUpdateRequest(BaseModel):
    title_fa: Optional[str] = None
    title_en: Optional[str] = None
    slug: Optional[str] = None
    description_fa: Optional[str] = None
    description_en: Optional[str] = None
    storyline_fa: Optional[str] = None
    developer: Optional[str] = None
    publisher: Optional[str] = None
    awards: Optional[list[str]] = None
    screenshots: Optional[list[str]] = None
    released: Optional[str] = None
    rating: Optional[float] = None
    metacritic: Optional[int] = None
    download_size_gb: Optional[float] = None
    is_two_player: Optional[bool] = None
    has_vr: Optional[bool] = None
    platforms: Optional[list[str]] = None
    genres: Optional[list[str]] = None
    cover_image_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    is_active: Optional[bool] = None
    download_links: Optional[list[DownloadLinkPayload]] = None



class SetFreeTierGamesRequest(BaseModel):
    game_ids: list[int] = Field(..., max_length=5, description="حداکثر ۵ شناسه بازی برای پلن رایگان")


class DiscountCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_percent: Optional[int] = 0
    max_discount_toman: Optional[int] = None
    fixed_discount_toman: Optional[int] = 0
    usage_limit: Optional[int] = 100
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = True
