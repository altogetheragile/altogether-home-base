// Base content interface for unified content management
export type ContentType = 'event' | 'blog_post' | 'knowledge_item';

export interface BaseContent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  is_published?: boolean;
  is_featured?: boolean;
  view_count?: number;
  content_type: ContentType;
}

// Type-specific metadata interfaces
export interface EventMetadata {
  start_date: string;
  end_date?: string;
  price_cents?: number;
  currency?: string;
  capacity?: number;
  location?: {
    id: string;
    name: string;
    address?: string;
  };
  instructor?: {
    id: string;
    name: string;
    bio?: string;
  };
  event_type?: {
    id: string;
    name: string;
  };
  format?: {
    id: string;
    name: string;
  };
  level?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  event_template?: {
    id: string;
    title: string;
    brand_color?: string;
    difficulty_rating?: string;
    popularity_score?: number;
    duration_days?: number;
  };
}

export interface BlogMetadata {
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  published_at?: string;
  estimated_reading_time?: number;
  like_count?: number;
  blog_categories?: {
    id: string;
    name: string;
    color?: string;
  };
  blog_tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface KnowledgeMetadata {
  name: string; // Knowledge items use 'name' instead of 'title'
  learning_value_summary?: string;
  background?: string;
  common_pitfalls?: string[];
  knowledge_categories?: {
    id: string;
    name: string;
    color?: string;
  };
  activity_domains?: {
    id: string;
    name: string;
    color?: string;
  };
  planning_focuses?: {
    id: string;
    name: string;
    color?: string;
  };
  knowledge_use_cases?: Array<{
    id: string;
    title?: string;
    case_type: string;
  }>;
}

// Unified content type
export interface UnifiedContent extends BaseContent {
  metadata?: EventMetadata | BlogMetadata | KnowledgeMetadata;
}

// Type guards for metadata
export function isEventMetadata(metadata: any): metadata is EventMetadata {
  return metadata && 'start_date' in metadata;
}

export function isBlogMetadata(metadata: any): metadata is BlogMetadata {
  return metadata && ('excerpt' in metadata || 'estimated_reading_time' in metadata);
}

export function isKnowledgeMetadata(metadata: any): metadata is KnowledgeMetadata {
  return metadata && ('learning_value_summary' in metadata || 'knowledge_categories' in metadata);
}