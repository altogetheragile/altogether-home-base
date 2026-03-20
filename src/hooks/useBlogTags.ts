import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export const useBlogTags = (limit?: number) => {
  return useQuery({
    queryKey: ['blog-tags', limit],
    queryFn: async (): Promise<BlogTag[]> => {
      // Only return tags that are actually used by published blog posts
      const { data: usedTagIds, error: junctionError } = await supabase
        .from('blog_post_tags')
        .select('tag_id, blog_posts!inner(is_published)')
        .eq('blog_posts.is_published', true);

      if (junctionError) throw junctionError;

      const tagIds = [...new Set((usedTagIds || []).map(r => r.tag_id))];
      if (tagIds.length === 0) return [];

      let query = supabase
        .from('blog_tags')
        .select('*')
        .in('id', tagIds)
        .order('usage_count', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as BlogTag[];
    },
  });
};