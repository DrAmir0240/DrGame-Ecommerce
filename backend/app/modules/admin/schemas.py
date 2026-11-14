"""Pydantic V2 schemas for Admin management, authentication, user quotas, finance and payouts."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, model_validator


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
    added_gb: Optional[float] = Field(None, description="میزان حجم افزایشی یا کاهشی به گیگابایت")
    additional_gb: Optional[float] = Field(None, description="نام فیلد ارسالی از فرانت‌اند برای حجم افزایشی")
    reason: Optional[str] = Field("شارژ دستی توسط مدیریت کلان", description="دلیل تغییر سهمیه")

    @property
    def effective_added_gb(self) -> float:
        if self.additional_gb is not None:
            return float(self.additional_gb)
        if self.added_gb is not None:
            return float(self.added_gb)
        return 0.0


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
    user_username: Optional[str] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    amount_toman: int
    status: str
    account_type: str
    account_holder: Optional[str] = None
    bank_name: Optional[str] = None
    sheba_number: Optional[str] = None
    card_number: Optional[str] = None
    crypto_wallet_address: Optional[str] = None
    crypto_network: Optional[str] = None
    admin_receipt_url: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None


class ProcessPayoutRequest(BaseModel):
    new_status: Optional[str] = Field(None, description="وضعیت جدید درخواست: approved یا rejected")
    status: Optional[str] = Field(None, description="نام جایگزین سازگار برای وضعیت")
    admin_receipt_url: Optional[str] = Field(None, description="لینک یا آدرس فیش بانکی/تراکنش")
    transaction_reference: Optional[str] = Field(None, description="نام جایگزین سازگار برای کد پیگیری")
    admin_notes: Optional[str] = Field(None, description="یادداشت مدیر")

    @model_validator(mode="after")
    def normalize_payout_payload(self):
        raw_status = (self.new_status or self.status or "").strip().lower()
        if raw_status in ("approved", "completed", "paid"):
            self.new_status = "approved"
        elif raw_status in ("rejected", "declined"):
            self.new_status = "rejected"
        else:
            raise ValueError("وضعیت جدید باید یکی از مقادیر approved یا rejected باشد.")

        if not self.admin_receipt_url and self.transaction_reference:
            self.admin_receipt_url = self.transaction_reference.strip()
        return self


class VerifyAccountRequest(BaseModel):
    is_verified: bool = Field(..., description="تایید یا رد حساب تسویه")


class ReleaseSelectedCommissionsRequest(BaseModel):
    user_ids: list[int] = Field(..., min_length=1, description="شناسه کاربران منتخب برای آزادسازی گروهی")


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
    source_id: Optional[str] = None
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
    source_id: Optional[str] = None
    rawg_id: Optional[int] = None
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


class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminManualSubscriptionGrant(BaseModel):
    tier_code: str = Field(..., description="bronze, silver, gold, or free")
    duration_months: int = Field(default=1, ge=1, le=12)
    quota_gb_override: Optional[float] = None


class AdminSubscriptionUpdate(BaseModel):
    status: Optional[str] = None  # active, expired, cancelled
    expires_at: Optional[datetime] = None
    remaining_quota_gb: Optional[float] = None


class AdminDiscountUpdate(BaseModel):
    discount_percent: Optional[int] = None
    max_discount_toman: Optional[int] = None
    fixed_discount_toman: Optional[int] = None
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


# --- 5 Department Admin Schemas & Audit Log Schemas ---

class DepartmentAdminLoginRequest(BaseModel):
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    password: str = Field(..., min_length=4, description="کلمه عبور")

    @model_validator(mode="after")
    def resolve_username(self):
        if not self.username_or_email and not self.username:
            raise ValueError("username or username_or_email is required")
        if not self.username_or_email and self.username:
            self.username_or_email = self.username
        return self



class DepartmentAdminInfo(BaseModel):
    id: int
    username: str
    email: str
    mobile: Optional[str] = None
    full_name: str
    access_level: str
    department: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class DepartmentAdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    admin: DepartmentAdminInfo


class DepartmentStaffCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=60)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    mobile: Optional[str] = None
    access_level: str = Field(default="read_only", description="read_only or full_crud")


class DepartmentStaffUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    access_level: Optional[str] = None
    is_active: Optional[bool] = None


class AdminAuditLogItem(BaseModel):
    id: int
    department: str
    admin_id: int
    admin_username: str
    action: str
    target_entity: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: dict = {}
    created_at: datetime


class AdminAuditLogListResponse(BaseModel):
    items: list[AdminAuditLogItem]
    total: int
    page: int
    page_size: int


