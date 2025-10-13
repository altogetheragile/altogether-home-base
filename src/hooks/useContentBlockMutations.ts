import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContentBlock, ContentBlockCreate, ContentBlockUpdate } from '@/types/page';
import { useToast } from '@/hooks/use-toast';

export const useContentBlockMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createContentBlock = useMutation({
    mutationFn: async (data: ContentBlockCreate): Promise<ContentBlock> => {
      const { data: result, error } = await supabase
        .from('content_blocks')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['page-by-id', data.page_id] });
      
      // Invalidate by slug for public viewers
      const { data: pageData } = await supabase
        .from('pages')
        .select('slug')
        .eq('id', data.page_id)
        .single();
      
      if (pageData?.slug) {
        queryClient.invalidateQueries({ queryKey: ['page', pageData.slug] });
      }
      
      toast({
        title: 'Success',
        description: 'Content block added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add content block',
        variant: 'destructive',
      });
      console.error('Error creating content block:', error);
    },
  });

  const updateContentBlock = useMutation({
    mutationFn: async (data: ContentBlockUpdate): Promise<ContentBlock> => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('content_blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['page-by-id', data.page_id] });
      
      // Invalidate by slug for public viewers
      const { data: pageData } = await supabase
        .from('pages')
        .select('slug')
        .eq('id', data.page_id)
        .single();
      
      if (pageData?.slug) {
        queryClient.invalidateQueries({ queryKey: ['page', pageData.slug] });
      }
      
      toast({
        title: 'Success',
        description: 'Content block updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update content block',
        variant: 'destructive',
      });
      console.error('Error updating content block:', error);
    },
  });

  const deleteContentBlock = useMutation({
    mutationFn: async (id: string): Promise<{ pageId: string; slug: string }> => {
      // Get the page_id and slug before deleting for cache invalidation
      const { data: block } = await supabase
        .from('content_blocks')
        .select('page_id, pages(slug)')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('content_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { 
        pageId: block?.page_id || '', 
        slug: (block?.pages as any)?.slug || '' 
      };
    },
    onSuccess: ({ pageId, slug }) => {
      if (pageId) {
        queryClient.invalidateQueries({ queryKey: ['page-by-id', pageId] });
      }
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ['page', slug] });
      }
      toast({
        title: 'Success',
        description: 'Content block deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete content block',
        variant: 'destructive',
      });
      console.error('Error deleting content block:', error);
    },
  });

  const reorderContentBlocks = useMutation({
    mutationFn: async (blocks: { id: string; position: number }[]): Promise<void> => {
      const { error } = await supabase.rpc('update_content_block_positions', {
        block_updates: blocks
      });

      if (error) {
        // Fallback to individual updates if RPC doesn't exist
        for (const block of blocks) {
          const { error: updateError } = await supabase
            .from('content_blocks')
            .update({ position: block.position })
            .eq('id', block.id);
          
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-by-id'] });
      toast({
        title: 'Success',
        description: 'Content blocks reordered successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reorder content blocks',
        variant: 'destructive',
      });
      console.error('Error reordering content blocks:', error);
    },
  });

  return {
    createContentBlock,
    updateContentBlock,
    deleteContentBlock,
    reorderContentBlocks,
  };
};