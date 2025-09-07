import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeTemplate, KnowledgeTemplateFormData } from '@/types/template';

export const useKnowledgeTemplates = () => {
  return useQuery({
    queryKey: ['knowledge-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeTemplate[];
    },
  });
};

export const useKnowledgeTemplate = (id?: string) => {
  return useQuery({
    queryKey: ['knowledge-template', id],
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      
      const { data, error } = await supabase
        .from('knowledge_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as KnowledgeTemplate | null;
    },
    enabled: !!id,
  });
};

export const useCreateKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: KnowledgeTemplateFormData) => {
      const { data: template, error } = await supabase
        .from('knowledge_templates')
        .insert([{
          ...data,
          config: {
            layout: 'canvas',
            dimensions: { width: 800, height: 600 },
            sections: [],
            styling: {}
          },
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KnowledgeTemplate> }) => {
      const { data: template, error } = await supabase
        .from('knowledge_templates')
        .update({
          ...data,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return template;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-template', id] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteKnowledgeTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });
};

// Hook for getting templates by type
export const useKnowledgeTemplatesByType = (templateType?: string) => {
  return useQuery({
    queryKey: ['knowledge-templates', 'type', templateType],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_templates')
        .select('*')
        .eq('is_public', true);

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return data as KnowledgeTemplate[];
    },
    enabled: templateType !== undefined,
  });
};