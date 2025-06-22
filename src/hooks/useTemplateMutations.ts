
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TemplateData {
  title: string;
  description?: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
}

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: async (data: TemplateData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: template, error } = await supabase
        .from('event_templates')
        .insert({
          ...data,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: template, error } = await supabase
        .from('event_templates')
        .update({
          ...data,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
