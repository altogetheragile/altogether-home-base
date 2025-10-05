import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KnowledgeItemStep {
  id: string;
  knowledge_item_id: string;
  step_number: number;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export const useKnowledgeItemSteps = (knowledgeItemId: string | undefined) => {
  return useQuery({
    queryKey: ['knowledge-item-steps', knowledgeItemId],
    queryFn: async (): Promise<KnowledgeItemStep[]> => {
      if (!knowledgeItemId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_item_steps')
        .select('*')
        .eq('knowledge_item_id', knowledgeItemId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!knowledgeItemId,
  });
};

export const useCreateKnowledgeStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (step: Partial<KnowledgeItemStep>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('knowledge_item_steps')
        .insert({
          ...step,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-steps', variables.knowledge_item_id] 
      });
      toast.success('Step added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add step: ${error.message}`);
    },
  });
};

export const useUpdateKnowledgeStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeItemStep> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('knowledge_item_steps')
        .update({
          ...updates,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-steps', data.knowledge_item_id] 
      });
      toast.success('Step updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update step: ${error.message}`);
    },
  });
};

export const useDeleteKnowledgeStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, knowledge_item_id }: { id: string; knowledge_item_id: string }) => {
      const { error } = await supabase
        .from('knowledge_item_steps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, knowledge_item_id };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['knowledge-item-steps', variables.knowledge_item_id] 
      });
      toast.success('Step deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete step: ${error.message}`);
    },
  });
};

export const useReorderKnowledgeSteps = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ steps }: { steps: KnowledgeItemStep[] }) => {
      const updates = steps.map((step, index) => 
        supabase
          .from('knowledge_item_steps')
          .update({ position: index })
          .eq('id', step.id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw errors[0].error;
      
      return steps;
    },
    onSuccess: (steps) => {
      if (steps.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['knowledge-item-steps', steps[0].knowledge_item_id] 
        });
      }
      toast.success('Steps reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder steps: ${error.message}`);
    },
  });
};
