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
  rawg_id: number;
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
}

export interface PaginatedGames {
  items: GameCardItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type GameListResponse = PaginatedGames;
