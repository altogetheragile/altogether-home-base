import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/page';
import { useToast } from '@/hooks/use-toast';

interface CreatePageData {
  slug: string;
  title: string;
  description?: string;
  is_published?: boolean;
}

interface UpdatePageData {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  is_published?: boolean;
}

export const usePageMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPage = useMutation({
    mutationFn: async (data: CreatePageData): Promise<Page> => {
      const { data: result, error } = await supabase
        .from('pages')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast({
        title: 'Success',
        description: 'Page created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'destructive',
      });
      console.error('Error creating page:', error);
    },
  });

  const updatePage = useMutation({
    mutationFn: async (data: UpdatePageData): Promise<Page> => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('pages')
        .update({
          ...updateData,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['page', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['page-by-id', data.id] });
      toast({
        title: 'Success',
        description: 'Page updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update page',
        variant: 'destructive',
      });
      console.error('Error updating page:', error);
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast({
        title: 'Success',
        description: 'Page deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      });
      console.error('Error deleting page:', error);
    },
  });

  return {
    createPage,
    updatePage,
    deletePage,
  };
};