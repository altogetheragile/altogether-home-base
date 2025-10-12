import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StyleTemplate {
  id: string;
  name: string;
  description?: string;
  styles: Record<string, any>;
  is_builtin: boolean;
  created_at: string;
}

export const useStyleTemplates = () => {
  return useQuery({
    queryKey: ['style-templates'],
    queryFn: async (): Promise<StyleTemplate[]> => {
      const { data, error } = await supabase
        .from('page_style_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateStyleTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; styles: Record<string, any> }) => {
      const { data: result, error } = await supabase
        .from('page_style_templates')
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
      queryClient.invalidateQueries({ queryKey: ['style-templates'] });
      toast({
        title: 'Success',
        description: 'Style template saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save style template',
        variant: 'destructive',
      });
      console.error('Error saving style template:', error);
    },
  });
};

export const useDeleteStyleTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_style_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-templates'] });
      toast({
        title: 'Success',
        description: 'Style template deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete style template',
        variant: 'destructive',
      });
      console.error('Error deleting style template:', error);
    },
  });
};
