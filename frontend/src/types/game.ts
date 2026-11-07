export interface Genre {
  id: number;
  rawg_id: number;
  name_fa: string;
  name_en: string;
  slug: string;
  image_background?: string | null;
}

export interface GameDownloadLink {
  id: number;
  part_number: number;
  part_name: string;
  file_size_gb: number;
  download_url: string;
  file_type?: 'data' | 'cheat' | 'dlc' | 'subtitle' | 'dubbing' | string;
  required_tier?: 'free' | 'bronze' | 'silver' | 'gold' | string;
  version?: string;
}

export interface GameCardItem {
  id: number;
  source_id?: string | null;
  rawg_id?: number | null;
  title_fa: string;
  title_en: string;
  slug: string;
  rating: number;
  metacritic?: number | null;
  download_size_gb: number;
  is_two_player: boolean;
  has_vr: boolean;
  platforms: string[];
  genres: string[];
  cover_image_url?: string | null;
  released?: string | null;
  likes_count: number;
  dislikes_count: number;
  wishlist_count: number;
  ps5_title_id?: string | null;
  ps4_title_id?: string | null;
  storage_sync_status?: string;
  file_size_bytes?: number | null;
  sha256_checksum?: string | null;
}

export interface StorageFormatItem {
  job_id: string;
  title: string;
  tag?: string | null;
  platform: 'ps5' | 'ps4' | string;
  format_category: 'fpkg' | 'fat32' | string;
  download_format: string;
  content_format: string;
  size_bytes: number;
  size_gb: number;
  sha256?: string | null;
  release_version?: string | null;
  status: string;
}

export interface ClientDeviceInfo {
  platform: 'ps5' | 'ps4' | 'desktop_or_mobile' | string;
  firmware?: number | null;
  recommended_format?: 'fpkg' | 'fat32' | string | null;
  is_console: boolean;
  display_notice: string;
}

export interface GameDownloadOptions {
  game_id: number;
  title_fa: string;
  title_en: string;
  slug: string;
  ps5_title_id?: string | null;
  ps4_title_id?: string | null;
  storage_sync_status: string;
  client_device: ClientDeviceInfo;
  recommended_job_id?: string | null;
  recommended_format?: string | null;
  available_formats: StorageFormatItem[];
}

export interface HandoffExecutePayload {
  job_id: string;
  handoff_secret: string;
  selected_format?: 'fpkg' | 'fat32' | string | null;
}

export interface HandoffExecuteResult {
  success: boolean;
  game_id: number;
  job_id: string;
  format_category: string;
  size_gb: number;
  remaining_quota_gb: number;
  message: string;
}

export interface GameDetail extends GameCardItem {
  description_fa?: string | null;
  description_en?: string | null;
  storyline_fa?: string | null;
  banner_image_url?: string | null;
  developer?: string | null;
  publisher?: string | null;
  awards?: string[];
  screenshots: string[];
  download_links: GameDownloadLink[];
  user_interaction?: 'like' | 'dislike' | null;
  in_wishlist: boolean;
  available_formats?: StorageFormatItem[];
}

export interface PaginatedGames {
  items: GameCardItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type GameListResponse = PaginatedGames;
