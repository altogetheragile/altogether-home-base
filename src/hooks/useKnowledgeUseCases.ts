import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KnowledgeUseCase {
  id: string;
  knowledge_item_id: string;
  case_type: 'generic' | 'example';
  title?: string;
  what?: string;
  who?: string;
  when_used?: string;
  where_used?: string;
  why?: string;
  how?: string;
  how_much?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeUseCases = (knowledgeItemId: string) => {
  return useQuery({
    queryKey: ['knowledge-use-cases', knowledgeItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_use_cases')
        .select('*')
        .eq('knowledge_item_id', knowledgeItemId)
        .order('case_type, created_at');
      
      if (error) throw error;
      return data as KnowledgeUseCase[];
    },
    enabled: !!knowledgeItemId,
  });
};

export const useCreateKnowledgeUseCase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (useCase: Omit<KnowledgeUseCase, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('knowledge_use_cases')
        .insert(useCase)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-use-cases', data.knowledge_item_id] });
      toast({
        title: 'Success',
        description: 'Use case created successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error creating use case:', error);
      toast({
        title: 'Error Creating Use Case',
        description: error.message || 'You may not have permission to create use cases for this item.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateKnowledgeUseCase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeUseCase> & { id: string }) => {
      const { data, error } = await supabase
        .from('knowledge_use_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-use-cases', data.knowledge_item_id] });
      toast({
        title: 'Success',
        description: 'Use case updated successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error updating use case:', error);
      toast({
        title: 'Error Updating Use Case',
        description: error.message || 'You may not have permission to update this use case.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteKnowledgeUseCase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, knowledgeItemId }: { id: string; knowledgeItemId: string }) => {
      const { error } = await supabase
        .from('knowledge_use_cases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, knowledgeItemId };
    },
    onSuccess: ({ knowledgeItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-use-cases', knowledgeItemId] });
      toast({
        title: 'Success',
        description: 'Use case deleted successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting use case:', error);
      toast({
        title: 'Error Deleting Use Case',
        description: error.message || 'You may not have permission to delete this use case.',
        variant: 'destructive',
      });
    },
  });
};