export interface ReferralStats {
  referral_code: string;
  withdrawable_balance_toman: number;
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
