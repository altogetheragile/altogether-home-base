import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeItemTemplate } from '@/types/template';

export const useKnowledgeItemTemplates = (knowledgeItemId: string) => {
  return useQuery({
    queryKey: ['knowledge-item-templates', knowledgeItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_item_templates')
        .select(`
          *,
          template:knowledge_templates(*)
        `)
        .eq('knowledge_item_id', knowledgeItemId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as KnowledgeItemTemplate[];
    },
    enabled: !!knowledgeItemId,
  });
};

export const useAssociateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      knowledgeItemId,
      templateId,
      displayOrder = 0,
      customConfig = {}
    }: {
      knowledgeItemId: string;
      templateId: string;
      displayOrder?: number;
      customConfig?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from('knowledge_item_templates')
        .insert({
          knowledge_item_id: knowledgeItemId,
          template_id: templateId,
          display_order: displayOrder,
          custom_config: customConfig
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { knowledgeItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-templates', knowledgeItemId] });
      toast({
        title: "Success",
        description: "Template associated successfully",
      });
    },
    onError: (error) => {
      console.error('Error associating template:', error);
      toast({
        title: "Error",
        description: "Failed to associate template",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveTemplateAssociation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (associationId: string) => {
      const { error } = await supabase
        .from('knowledge_item_templates')
        .delete()
        .eq('id', associationId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-templates'] });
      toast({
        title: "Success",
        description: "Template association removed",
      });
    },
    onError: (error) => {
      console.error('Error removing template association:', error);
      toast({
        title: "Error",
        description: "Failed to remove template association",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTemplateAssociation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      displayOrder,
      customConfig
    }: {
      id: string;
      displayOrder?: number;
      customConfig?: Record<string, any>;
    }) => {
      const updateData: Record<string, any> = {};
      if (displayOrder !== undefined) updateData.display_order = displayOrder;
      if (customConfig !== undefined) updateData.custom_config = customConfig;

      const { data, error } = await supabase
        .from('knowledge_item_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-templates'] });
      toast({
        title: "Success",
        description: "Template association updated",
      });
    },
    onError: (error) => {
      console.error('Error updating template association:', error);
      toast({
        title: "Error",
        description: "Failed to update template association",
        variant: "destructive",
      });
    },
  });
};