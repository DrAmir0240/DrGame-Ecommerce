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

export interface ReferralChainAdminItem {
  id: number;
  user_id: number;
  referrer_id: number;
  created_at: string;
  user_username?: string;
  user_full_name?: string;
  user_phone?: string | null;
  user_is_referral_blocked?: boolean;
  user_is_subscription_banned?: boolean;
  referrer_username?: string;
  referrer_full_name?: string;
  referrer_phone?: string | null;
  referrer_is_referral_blocked?: boolean;
  referrer_is_subscription_banned?: boolean;
}

export interface BlacklistEntryItem {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  blocked_national_code?: string | null;
  block_referral: boolean;
  block_subscription: boolean;
  reason?: string | null;
  is_active: boolean;
  blocked_at?: string | null;
  unblocked_at?: string | null;
  admin_id?: number | null;
  admin_username?: string | null;
}

export interface ReleaseUserCommissionResponse {
  status: string;
  message: string;
  user_id: number;
  batch_code?: string | null;
  settled_amount_toman: number;
  transactions_count: number;
  new_withdrawable_balance: number;
}

// --- Step 28: Referral Admin Redesign & 3-Angle Chain Tracer Types ---

export type AnomalyFlagType =
  | 'blocked_in_chain'
  | 'hidden_pass_through'
  | 'subscription_banned'
  | 'many_inactive_downlines'
  | 'zero_commission_cluster';

export interface ReferralUserSearchItem {
  id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  referral_code: string;
  is_referral_hidden: boolean;
  is_referral_blocked: boolean;
  is_subscription_banned: boolean;
  has_referrer: boolean;
}

export interface NetworkRootItem {
  user_id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  referral_code: string;
  is_referral_hidden: boolean;
  is_referral_blocked: boolean;
  is_subscription_banned: boolean;
  has_active_subscription: boolean;
  direct_downlines_count: number;
  total_subtree_count: number;
  total_earned_toman: number;
  pending_commission_toman: number;
  anomaly_flags: AnomalyFlagType[];
}

export interface AdminUplineNode {
  level: number;
  effective_layer: number | null;
  nominal_share_percent: number;
  user_id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  is_referral_hidden: boolean;
  is_referral_blocked: boolean;
  is_subscription_banned: boolean;
  has_active_subscription: boolean;
}

export interface AdminDownlineNode {
  user_id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  referral_code?: string;
  is_referral_hidden: boolean;
  is_referral_blocked: boolean;
  is_subscription_banned: boolean;
  has_active_subscription: boolean;
  direct_children_count: number;
  total_subtree_count: number;
  contributed_commission_toman: number;
  pending_commission_toman: number;
  anomaly_flags: AnomalyFlagType[];
  created_at?: string;
}

export interface AdminTreeOrderItem {
  id: number;
  tier_code: string;
  original_price: number;
  discount_amount: number;
  final_price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface AdminTreeSettlementAccountItem {
  id: number;
  account_type: string;
  account_holder?: string | null;
  bank_name?: string | null;
  sheba_number?: string | null;
  card_number?: string | null;
  crypto_wallet_address?: string | null;
  crypto_network?: string | null;
  national_code?: string | null;
  is_verified: boolean;
}

export interface AdminTreeResponse {
  user: {
    id: number;
    username: string;
    full_name: string;
    phone?: string | null;
    referral_code: string;
    is_referral_hidden: boolean;
    is_referral_blocked: boolean;
    is_subscription_banned: boolean;
    has_active_subscription: boolean;
    direct_children_count: number;
    total_subtree_count: number;
    anomaly_flags: AnomalyFlagType[];
    created_at?: string;
  };
  wallet: {
    withdrawable_balance_toman: number;
    pending_balance_toman: number;
    total_earned_toman: number;
    total_withdrawn_toman?: number;
  };
  uplines: AdminUplineNode[];
  direct_downlines: AdminDownlineNode[];
  direct_downlines_total: number;
  settlement_accounts: AdminTreeSettlementAccountItem[];
  active_blacklist: {
    id: number;
    block_referral: boolean;
    block_subscription: boolean;
    reason?: string | null;
    blocked_at: string;
  } | null;
  recent_orders: AdminTreeOrderItem[];
}

export interface EnrichedChainAdminItem extends ReferralChainAdminItem {
  user_is_referral_hidden?: boolean;
  user_has_active_subscription?: boolean;
  referrer_is_referral_hidden?: boolean;
  root_user_id?: number;
  root_username?: string;
  depth_from_root?: number;
  anomaly_flags?: AnomalyFlagType[];
}

export interface RecentCommissionOrderItem {
  order_payment_id: number;
  buyer_user_id: number;
  buyer_username: string;
  buyer_full_name: string;
  tier_code: string;
  final_price: number;
  budget_21_toman: number;
  user_commission_toman: number;
  treasury_commission_toman: number;
  ledger_count: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface OrderWaterfallTraceResponse {
  order: {
    id: number;
    tier_code: string;
    original_price: number;
    discount_amount: number;
    final_price: number;
    payment_method: string;
    transaction_ref: string;
    status: string;
    created_at: string;
    buyer: {
      id: number;
      username: string;
      full_name: string;
      phone?: string | null;
    };
  };
  summary: {
    budget_21_toman: number;
    shop_share_79_toman: number;
    user_distributed_toman: number;
    treasury_diverted_toman: number;
    settled_toman: number;
    pending_toman: number;
  };
  current_upline_path: Array<{
    raw_level: number;
    effective_layer: number | null;
    user_id: number;
    username: string;
    full_name: string;
    is_referral_hidden: boolean;
    is_referral_blocked: boolean;
    has_active_subscription: boolean;
    expected_share_percent: number;
    expected_share_toman: number;
    node_mode: 'active_user' | 'bypass_hidden' | 'ghosted_to_treasury';
  }>;
  recorded_ledgers: Array<{
    id: number;
    beneficiary_type: string;
    user_id: number | null;
    username?: string | null;
    full_name?: string | null;
    tier_level: number;
    amount_toman: number;
    settlement_status: string;
    settlement_batch_id?: string | null;
    description: string;
    created_at: string;
  }>;
  treasury_logs: Array<{
    id: number;
    action_type: string;
    amount_toman: number;
    description: string;
    created_at: string;
  }>;
}

export interface SimulateWaterfallResponse {
  buyer: {
    id: number;
    username: string;
    full_name: string;
  };
  amount_toman: number;
  budget_21_toman: number;
  shop_share_79_toman: number;
  user_credited_toman: number;
  ghosted_treasury_toman: number;
  inactive_treasury_toman: number;
  leftover_treasury_toman: number;
  total_treasury_toman: number;
  steps: Array<{
    raw_level: number;
    effective_layer: number | null;
    user_id: number;
    username: string;
    full_name: string;
    is_referral_hidden: boolean;
    is_referral_blocked: boolean;
    has_active_subscription: boolean;
    action: 'credit_user' | 'bypass_hidden' | 'ghosted_to_treasury' | 'inactive_sub_to_treasury';
    recipient_type: string;
    share_percent: number;
    amount_toman: number;
    reason: string;
  }>;
}

export interface ReferralOverviewResponse {
  metrics: {
    pending_commissions_toman: number;
    pending_beneficiaries_count: number;
    pending_transactions_count: number;
    next_settlement_date: string;
    pending_payouts_count: number;
    pending_payouts_amount_toman: number;
    unverified_accounts_count: number;
    total_accounts_count: number;
    treasury_balance_toman: number;
    treasury_total_collected_toman: number;
    treasury_total_distributed_toman: number;
    total_chains_count: number;
    active_blacklist_count: number;
  };
  recent_pending_payouts: Array<{
    id: number;
    user_id: number;
    user_username: string;
    user_name: string;
    amount_toman: number;
    account_type: string;
    bank_name?: string | null;
    created_at: string;
  }>;
  recent_pending_accounts: Array<{
    id: number;
    user_id: number;
    username: string;
    user_full_name: string;
    account_holder?: string | null;
    account_type: string;
    bank_name?: string | null;
    sheba_number?: string | null;
    crypto_wallet_address?: string | null;
    created_at: string;
  }>;
  recent_batches: SettlementBatchItem[];
}

export interface AdminPayoutItem {
  id: number;
  user_id: number;
  user_username?: string | null;
  user_name?: string | null;
  user_phone?: string | null;
  amount_toman: number;
  status: string;
  account_type: string;
  account_holder?: string | null;
  bank_name?: string | null;
  sheba_number?: string | null;
  card_number?: string | null;
  crypto_wallet_address?: string | null;
  crypto_network?: string | null;
  admin_receipt_url?: string | null;
  admin_notes?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface AdminPayoutListResponse {
  items: AdminPayoutItem[];
  total: number;
  page: number;
  page_size: number;
  summary: {
    pending_count: number;
    pending_amount_toman: number;
    approved_count: number;
    rejected_count: number;
  };
}

export interface AdminSettlementAccountItem extends SettlementAccount {
  username?: string | null;
  user_full_name?: string | null;
  user_phone?: string | null;
  national_code?: string | null;
  phone?: string | null;
}

export interface AdminSettlementAccountListResponse {
  items: AdminSettlementAccountItem[];
  total: number;
  page: number;
  page_size: number;
  summary: {
    total_count: number;
    pending_count: number;
    verified_count: number;
  };
}

export interface SettlementBatchDetailsResponse {
  batch: SettlementBatchItem;
  ledgers: Array<{
    id: number;
    order_payment_id: number;
    beneficiary_type: string;
    user_id: number | null;
    username?: string | null;
    full_name?: string | null;
    tier_level: number;
    amount_toman: number;
    description: string;
    settlement_status: string;
    settled_at?: string | null;
    settlement_batch_id?: string | null;
    created_at: string;
  }>;
}
