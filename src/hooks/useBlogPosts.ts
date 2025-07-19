import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  author_id?: string;
  category_id?: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  estimated_reading_time: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
  blog_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  blog_tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface UseBlogPostsOptions {
  search?: string;
  categoryId?: string;
  tag?: string;
  sortBy?: string;
  featured?: boolean;
  limit?: number;
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  const { search, categoryId, tag, sortBy = 'created_at', featured, limit } = options;

  return useQuery({
    queryKey: ['blog-posts', { search, categoryId, tag, sortBy, featured, limit }],
    queryFn: async (): Promise<BlogPost[]> => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug,
            color
          ),
          blog_post_tags!inner (
            blog_tags (
              id,
              name,
              slug
            )
          )
        `)
        .eq('is_published', true);

      // Add featured filter
      if (featured) {
        query = query.eq('is_featured', true);
      }

      // Add category filter
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      // Add tag filter
      if (tag && tag !== 'all') {
        query = query.eq('blog_post_tags.blog_tags.slug', tag);
      }

      // Add search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%, excerpt.ilike.%${search}%, content.ilike.%${search}%`);
      }

      // Add sorting
      switch (sortBy) {
        case 'popularity':
          query = query.order('view_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('published_at', { ascending: true });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('published_at', { ascending: false });
      }

      // Add limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten blog_tags
      return (data || []).map(post => ({
        ...post,
        blog_tags: post.blog_post_tags?.map((pt: any) => pt.blog_tags).filter(Boolean) || []
      }));
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async (): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug,
            color
          ),
          blog_post_tags!inner (
            blog_tags (
              id,
              name,
              slug
            )
          )
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      // Transform the data to flatten blog_tags
      return {
        ...data,
        blog_tags: data.blog_post_tags?.map((pt: any) => pt.blog_tags).filter(Boolean) || []
      };
    },
    enabled: !!slug,
  });
};