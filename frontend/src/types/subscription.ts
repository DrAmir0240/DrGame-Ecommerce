export interface SubscriptionTier {
  id: string | number;
  code: 'free' | 'bronze' | 'silver' | 'gold' | string;
  name?: string;
  name_fa?: string;
  name_en?: string;
  badge?: string;
  price_toman?: number;
  price_usd?: number;
  price_irr?: number;
  quota_gb: number;
  speed_limit_mbps?: number;
  max_download_speed_mbps?: number | null;
  daily_download_limit_gb?: number | null;
  concurrent_downloads?: number;
  allowed_platforms?: string[];
  supported_consoles?: string[];
  allow_dlc?: boolean;
  allow_subtitles?: boolean;
  allow_themes?: boolean;
  features?: string[];
  is_active?: boolean;
}

export interface UserQuota {
  user_id?: string | number;
  total_quota_gb: number;
  used_quota_gb: number;
  remaining_quota_gb: number;
  is_exhausted: boolean;
  tier_code: string;
  tier_name: string;
  expires_at: string | null;
}

export interface DiscountValidationResult {
  valid: boolean;
  code: string;
  discount_amount: number;
  final_price: number;
  // Backwards compatibility aliases
  discount_percent?: number;
  discount_amount_irr?: number;
  original_price_irr?: number;
  final_price_irr?: number;
  is_valid?: boolean;
  message?: string;
}

export interface CheckoutResponse {
  status: string;
  transaction_ref: string;
  tier_code: string;
  tier_name: string;
  end_date: string;
  quota: any;
  order_id?: string;
  tracking_code?: string;
  final_amount_irr?: number;
  expires_at?: string;
  message?: string;
}
