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
      let query = supabase
        .from('blog_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};