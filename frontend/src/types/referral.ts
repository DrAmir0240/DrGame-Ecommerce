export interface ReferralStats {
  referral_code: string;
  withdrawable_balance_toman: number;
  pending_balance_toman: number;
  next_settlement_date?: string | null;
  total_earned_toman: number;
  total_withdrawn_toman: number;
  direct_referrals_count: number;
  active_subscriptions_count: number;
}

export interface CommissionTransaction {
  id: number;
  order_payment_id: number;
  beneficiary_type: string;
  tier_level: number;
  amount_toman: number;
  description: string;
  settlement_status?: 'pending' | 'settled' | 'cancelled' | string;
  settled_at?: string | null;
  settlement_batch_id?: string | null;
  created_at: string;
}

export interface CommissionTransactionListResponse {
  items: CommissionTransaction[];
  total: number;
  page: number;
  page_size: number;
}

export interface SettlementAccount {
  id: number;
  user_id: number;
  account_type: 'bank_iran' | 'crypto';
  sheba_number?: string | null;
  card_number?: string | null;
  account_holder?: string | null;
  bank_name?: string | null;
  crypto_wallet_address?: string | null;
  crypto_network?: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  settlement_account_id: number;
  amount_toman: number;
  status: string;
  created_at: string;
}

export interface NetworkLevelStat {
  level: number;
  percentage: number;
  members_count: number;
  active_subscribers_count: number;
  total_earned_toman: number;
}

export interface NetworkTreeResponse {
  total_members: number;
  total_active_subscribers: number;
  levels: NetworkLevelStat[];
}

export interface ReferralMemberItem {
  user_id: number;
  masked_username: string;
  masked_phone?: string | null;
  level: number;
  joined_at: string;
  has_active_subscription: boolean;
  total_contributed_commission_toman: number;
}

export interface ReferralMemberListResponse {
  items: ReferralMemberItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface SettlementBatchItem {
  id: number;
  batch_code: string;
  total_amount_toman: number;
  total_transactions_count: number;
  beneficiaries_count: number;
  executed_by_type: string;
  executed_by_admin_id?: number | null;
  period_start?: string | null;
  period_end: string;
  created_at: string;
}

export interface SettlementPreviewBeneficiary {
  user_id: number;
  username: string;
  full_name: string;
  pending_amount_toman: number;
  transactions_count: number;
}

export interface SettlementPreviewResponse {
  total_pending_amount_toman: number;
  total_pending_transactions: number;
  total_beneficiaries: number;
  beneficiaries: SettlementPreviewBeneficiary[];
  period_end: string;
}

export interface UserDiscountItem {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  title: string;
  discount_percent: number;
  max_discount_toman?: number | null;
  applicable_tier_codes: string[];
  starts_at: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string | null;
  order_payment_id?: number | null;
  is_active: boolean;
  created_at: string;
}
