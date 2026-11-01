export interface FaqItem {
  question: string;
  answer: string;
}

export interface SiteSettings {
  id: number;
  header_dns_primary?: string;
  primary_dns?: string;
  header_dns_secondary?: string;
  secondary_dns?: string;
  server_status_text?: string;
  server_is_online?: boolean;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  footer_message?: string;
  support_working_hours?: string;
  social_telegram?: string;
  telegram_url?: string;
  social_instagram?: string;
  instagram_url?: string;
  social_youtube?: string;
  youtube_url?: string;
  twitter_url?: string;
  discord_url?: string;
  enamad_url?: string;
  samandehi_url?: string;
  jailbreak_dns?: string;
  jailbreak_supported_firmwares?: string[];
  jailbreak_config?: {
    supported_firmwares?: string[];
    goldhen_version?: string;
    dns_servers?: string[];
    payloads?: Array<{ name: string; version: string; file: string }>;
    [key: string]: any;
  };
  faq_items?: FaqItem[];
  updated_at?: string;
}

export interface SiteSettingsUpdatePayload {
  header_dns_primary?: string;
  header_dns_secondary?: string;
  primary_dns?: string;
  secondary_dns?: string;
  server_status_text?: string;
  server_is_online?: boolean;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  footer_message?: string;
  support_working_hours?: string;
  social_telegram?: string;
  social_instagram?: string;
  social_youtube?: string;
  telegram_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  discord_url?: string;
  enamad_url?: string;
  samandehi_url?: string;
  jailbreak_dns?: string;
  jailbreak_supported_firmwares?: string[];
  jailbreak_config?: Record<string, any>;
  faq_items?: FaqItem[];
}

