export interface User {
  id: number;
  full_name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  console_auth_code: string;
  referral_code: string;
  avatar_url?: string | null;
  hero_banner_url?: string | null;
  is_preset_avatar: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface UserSession {
  id: number;
  device_name: string;
  device_type: 'console' | 'mobile' | 'desktop';
  ip_address?: string | null;
  user_agent?: string | null;
  is_active: boolean;
  is_current?: boolean;
  is_primary?: boolean;
  last_active_at: string;
  created_at: string;
}
