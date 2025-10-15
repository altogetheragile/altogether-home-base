export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ContentBlock {
  id: string;
  page_id: string;
  type: 'text' | 'image' | 'video' | 'hero' | 'section' | 'recommendations' | 'testimonials-carousel';
  content: Record<string, any>;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendationsBlockContent {
  title?: string;
  contentTypes?: ('technique' | 'event' | 'blog' | 'testimonial')[];
  limit?: number;
  showViewAll?: boolean;
  excludeIds?: string[];
}

export interface TestimonialsCarouselBlockContent {
  title?: string;
  limit?: number;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

export interface PageWithBlocks extends Page {
  content_blocks: ContentBlock[];
}

export interface ContentBlockCreate {
  page_id: string;
  type: ContentBlock['type'];
  content: Record<string, any>;
  position: number;
  is_visible?: boolean;
}

export interface ContentBlockUpdate {
  id: string;
  type?: ContentBlock['type'];
  content?: Record<string, any>;
  position?: number;
  is_visible?: boolean;
}