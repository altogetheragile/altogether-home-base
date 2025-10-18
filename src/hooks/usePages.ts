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
      // First, fetch the page
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (pageError) {
        if (pageError.code === 'PGRST116') return null;
        throw pageError;
      }

      if (!pageData) return null;

      // Then, fetch content blocks separately
      const { data: blocksData, error: blocksError } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', pageData.id)
        .order('position');

      if (blocksError) {
        console.error('Error fetching content blocks:', blocksError);
        // Return page with empty blocks rather than failing
        return { ...pageData, content_blocks: [] };
      }

      // Combine and return
      return {
        ...pageData,
        content_blocks: blocksData || []
      };
    },
    enabled: !!slug,
  });
};

export const usePageById = (id: string) => {
  return useQuery({
    queryKey: ['page-by-id', id],
    queryFn: async (): Promise<PageWithBlocks | null> => {
      // Fetch page first
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (pageError) {
        if (pageError.code === 'PGRST116') return null;
        throw pageError;
      }

      if (!pageData) return null;

      // Fetch content blocks separately
      const { data: blocksData, error: blocksError } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('page_id', pageData.id)
        .order('position');

      if (blocksError) {
        console.error('Error fetching content blocks:', blocksError);
        return { ...pageData, content_blocks: [] };
      }

      return {
        ...pageData,
        content_blocks: blocksData || []
      };
    },
    enabled: !!id,
  });
};