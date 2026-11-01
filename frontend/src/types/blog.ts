export interface BlogCategory {
  id: number;
  name_fa: string;
  name_en: string;
  slug: string;
}

export interface BlogPostCard {
  id: number;
  title_fa: string;
  title_en: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  cover_image_url: string;
  author_name: string;
  reading_time_min: number;
  likes_count: number;
  dislikes_count: number;
  views_count: number;
  summary: string;
  created_at: string;
}

export interface BlogPostListResponse {
  items: BlogPostCard[];
  total: number;
  page: number;
  page_size: number;
}

export interface BlogPostDetail extends BlogPostCard {
  content_fa: string;
  content_en?: string | null;
  user_interaction?: 'like' | 'dislike' | null;
}

// Admin Blog CRUD types (Step 14)
export interface AdminBlogPost {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image_url: string;
  category_id: number;
  category_name?: string;
  reading_time_minutes: number;
  is_published: boolean;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminBlogPostCreate {
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image_url: string;
  category_id: number;
  reading_time_minutes: number;
  is_published: boolean;
}

export interface AdminBlogPostUpdate extends Partial<AdminBlogPostCreate> {}

export interface AdminBlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface AdminBlogCategoryCreate {
  name: string;
  slug: string;
  description?: string;
}

export interface AdminBlogPostListResponse {
  items: AdminBlogPost[];
  total: number;
  page: number;
  page_size: number;
}
