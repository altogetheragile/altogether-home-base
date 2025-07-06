import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page, PageWithBlocks } from '@/types/page';

export const usePages = () => {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async (): Promise<Page[]> => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      return data || [];
    },
  });
};

export const usePage = (slug: string) => {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: async (): Promise<PageWithBlocks | null> => {
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          content_blocks (*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Sort content blocks by position
      if (data?.content_blocks) {
        data.content_blocks.sort((a, b) => a.position - b.position);
      }

      return data;
    },
    enabled: !!slug,
  });
};

export const usePageById = (id: string) => {
  return useQuery({
    queryKey: ['page-by-id', id],
    queryFn: async (): Promise<PageWithBlocks | null> => {
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          content_blocks (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Sort content blocks by position
      if (data?.content_blocks) {
        data.content_blocks.sort((a, b) => a.position - b.position);
      }

      return data;
    },
    enabled: !!id,
  });
};