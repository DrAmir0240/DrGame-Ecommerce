export interface AdminProfile {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AdminDashboardStats {
  total_users: number;
  active_subscriptions: number;
  total_games: number;
  pending_payouts: number;
  total_revenue_toman: number;
}

export interface AdminUserListItem {
  id: number;
  full_name: string | null;
  username: string;
  phone: string | null;
  email: string | null;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  total_quota_gb: number;
  used_quota_gb: number;
}

export interface AdminUserDossier {
  user: {
    id: number;
    full_name: string | null;
    username: string;
    phone: string | null;
    email: string | null;
    referral_code: string;
    is_active: boolean;
    created_at: string;
  };
  quota: {
    total_gb: number;
    used_gb: number;
    remaining_gb: number;
    is_exhausted: boolean;
  };
  wallet: {
    withdrawable_balance_toman: number;
    total_earned_toman: number;
  };
  recent_payments: Array<{
    id: number;
    tier_code: string;
    final_price: number;
    status: string;
    created_at: string;
  }>;
}

export interface FinanceOverview {
  total_orders_count: number;
  total_domestic_volume_toman: number;
  total_crypto_orders_count: number;
  recent_transactions: Array<{
    id: number;
    user_id: number;
    tier_code: string;
    amount_toman: number;
    payment_method: string;
    transaction_ref: string | null;
    status: string;
    created_at: string;
  }>;
}

export interface AdminPayoutItem {
  id: number;
  user_id: number;
  user_name: string | null;
  user_phone: string | null;
  amount_toman: number;
  status: "pending" | "approved" | "rejected";
  account_type: "sheba" | "card" | "crypto";
  sheba_number: string | null;
  card_number: string | null;
  crypto_wallet_address: string | null;
  crypto_network: string | null;
  created_at: string;
}

export interface AdminGameDownloadLink {
  id?: number;
  part_number: number;
  part_name: string;
  file_size_gb: number;
  download_url: string;
  is_active: boolean;
  file_type?: 'data' | 'cheat' | 'dlc' | 'subtitle' | 'dubbing';
  required_tier?: 'free' | 'bronze' | 'silver' | 'gold';
  version?: string;
}

export interface AdminGameItem {
  id: number;
  rawg_id: number;
  title_fa: string;
  title_en: string;
  slug: string;
  rating: number;
  metacritic?: number | null;
  download_size_gb: number;
  description_fa?: string | null;
  description_en?: string | null;
  storyline_fa?: string | null;
  developer?: string | null;
  publisher?: string | null;
  awards?: string[];
  screenshots?: string[];
  released?: string | null;
  is_two_player?: boolean;
  has_vr?: boolean;
  cover_image_url: string | null;
  banner_image_url: string | null;
  platforms: string[];
  genres: string[];
  is_active: boolean;
  download_links?: AdminGameDownloadLink[];
}


export interface AdminFreeTierGame {
  id: number;
  game_id: number;
  title_fa: string;
  title_en: string;
  cover_image_url: string | null;
  is_active: boolean;
  added_at: string;
}

export interface AdminDiscountCode {
  id: number;
  code: string;
  discount_percent: number;
  max_discount_toman: number | null;
  fixed_discount_toman: number;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface AdminSubscriptionItem {
  id: number;
  user_id: number;
  user_name: string | null;
  user_phone: string | null;
  tier_code: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  status: string;
}
