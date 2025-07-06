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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['page-by-id', data.page_id] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['page-by-id', data.page_id] });
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
    mutationFn: async (id: string): Promise<string> => {
      // Get the page_id before deleting for cache invalidation
      const { data: block } = await supabase
        .from('content_blocks')
        .select('page_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('content_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return block?.page_id || '';
    },
    onSuccess: (pageId) => {
      if (pageId) {
        queryClient.invalidateQueries({ queryKey: ['page-by-id', pageId] });
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