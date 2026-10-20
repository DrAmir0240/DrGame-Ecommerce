export interface QuotaStatus {
  user_id: number | null;
  has_active_subscription: boolean;
  tier_name: string;
  tier_slug: string;
  total_quota_bytes: number;
  used_quota_bytes: number;
  remaining_quota_bytes: number;
  total_quota_gb: number;
  used_quota_gb: number;
  remaining_quota_gb: number;
  used_percentage: number;
  formatted_pill_text: string;
  is_exhausted: boolean;
}

export interface SubscriptionTier {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  duration_days: number;
  quota_bytes: number;
  quota_gb: number;
  max_download_speed_mbps: number;
  allowed_platforms: string[];
  features: string[];
  limitations: string[];
  is_active: boolean;
}

export interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gamer_tag: string | null;
  xp: number;
  level: number;
  total_playtime_hours: number;
  streak_days: number;
  wallet_balance: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  profile?: UserProfile | null;
}
