// Adapters to convert existing data types to unified content format
import { UnifiedContent, BlogMetadata, EventMetadata, KnowledgeMetadata } from '@/types/content';
import { BlogPost } from '@/hooks/useBlogPosts';
import { EventData } from '@/hooks/useEvents';
import { KnowledgeItem } from '@/hooks/useKnowledgeItems';

export function adaptBlogPostToUnifiedContent(blogPost: BlogPost): UnifiedContent {
  const metadata: BlogMetadata = {
    excerpt: blogPost.excerpt,
    content: blogPost.content,
    featured_image_url: blogPost.featured_image_url,
    published_at: blogPost.published_at,
    estimated_reading_time: blogPost.estimated_reading_time,
    like_count: blogPost.like_count,
    blog_categories: blogPost.blog_categories,
    blog_tags: blogPost.blog_tags
  };

  return {
    id: blogPost.id,
    title: blogPost.title,
    slug: blogPost.slug,
    description: blogPost.excerpt,
    created_at: blogPost.created_at,
    updated_at: blogPost.updated_at,
    created_by: blogPost.author_id,
    updated_by: undefined,
    is_published: blogPost.is_published,
    is_featured: blogPost.is_featured,
    view_count: blogPost.view_count,
    content_type: 'blog_post',
    metadata
  };
}

export function adaptEventToUnifiedContent(event: EventData): UnifiedContent {
  const metadata: EventMetadata = {
    start_date: event.start_date,
    end_date: event.end_date || undefined,
    price_cents: event.price_cents,
    currency: event.currency,
    location: event.location ? {
      id: '', // EventData doesn't have location id
      name: event.location.name,
      address: event.location.address || undefined
    } : undefined,
    instructor: event.instructor ? {
      id: '', // EventData doesn't have instructor id
      name: event.instructor.name,
      bio: event.instructor.bio || undefined
    } : undefined,
    event_type: event.event_type ? {
      id: '', // EventData doesn't have type id
      name: event.event_type.name
    } : undefined,
    format: event.format ? {
      id: '', // EventData doesn't have format id
      name: event.format.name
    } : undefined,
    level: event.level ? {
      id: '', // EventData doesn't have level id
      name: event.level.name
    } : undefined,
    category: event.category ? {
      id: '', // EventData doesn't have category id
      name: event.category.name
    } : undefined,
    event_template: event.event_template
  };

  return {
    id: event.id,
    title: event.title,
    slug: event.id, // Events don't have slugs, use id
    description: event.description || undefined,
    created_at: event.event_template?.created_at || new Date().toISOString(),
    updated_at: event.event_template?.created_at || new Date().toISOString(),
    created_by: undefined,
    is_published: event.is_published,
    is_featured: false, // Events don't have featured status
    view_count: 0, // Events don't track views
    content_type: 'event',
    metadata
  };
}

export function adaptKnowledgeItemToUnifiedContent(item: KnowledgeItem): UnifiedContent {
  const metadata: KnowledgeMetadata = {
    name: item.name,
    learning_value_summary: item.learning_value_summary,
    background: item.background,
    common_pitfalls: item.common_pitfalls,
    knowledge_categories: item.knowledge_categories,
    activity_domains: item.activity_domains,
    planning_focuses: item.planning_focuses,
    knowledge_use_cases: item.knowledge_use_cases
  };

  return {
    id: item.id,
    title: item.name,
    slug: item.slug,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
    created_by: item.created_by,
    updated_by: item.updated_by,
    is_published: item.is_published,
    is_featured: item.is_featured,
    view_count: item.view_count,
    content_type: 'knowledge_item',
    metadata
  };
}