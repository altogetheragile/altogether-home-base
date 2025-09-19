import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeTemplateFormData } from '@/types/template';

export const useKnowledgeTemplateMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: async (data: KnowledgeTemplateFormData & { version?: string; replaceExisting?: boolean; existingId?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Extract control fields
      const { replaceExisting, existingId, version, ...templateData } = data;
      
      // If replacing existing template
      if (replaceExisting && existingId) {
        const { error } = await supabase
          .from('knowledge_templates')
          .update({
            ...templateData,
            updated_by: user.id,
            version: version || '1.0'
          })
          .eq('id', existingId);

        if (error) throw error;
        return { id: existingId };
      }
      
      // Creating new template
      const newId = crypto.randomUUID();
      const { error } = await supabase
        .from('knowledge_templates')
        .insert({
          id: newId,
          ...templateData,
          created_by: user.id,
          updated_by: user.id,
          version: version || '1.0'
        });

      if (error) throw error;
      return { id: newId } as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<KnowledgeTemplateFormData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: template, error } = await supabase
        .from('knowledge_templates')
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
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
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
        .from('knowledge_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-templates'] });
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