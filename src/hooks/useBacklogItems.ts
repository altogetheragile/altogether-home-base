import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BacklogItem {
  id: string;
  project_id: string | null;
  product_id: string | null;
  user_story_id: string | null;
  title: string;
  description: string | null;
  acceptance_criteria: string[] | null;
  priority: string;
  status: string;
  backlog_position: number;
  estimated_value: number | null;
  estimated_effort: number | null;
  source: string | null;
  target_release: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Parent-child relationship for split items
  parent_item_id: string | null;
}

export type BacklogItemInsert = Omit<BacklogItem, 'id' | 'created_at' | 'updated_at'>;
export type BacklogItemUpdate = Partial<BacklogItemInsert>;

export const useBacklogItems = (projectId?: string) => {
  return useQuery({
    queryKey: ['backlog-items', projectId],
    queryFn: async () => {
      let query = supabase
        .from('backlog_items')
        .select('*')
        .order('backlog_position', { ascending: true });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BacklogItem[];
    },
    enabled: !!projectId,
  });
};

export const useCreateBacklogItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Partial<BacklogItemInsert>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get max position for this project
      const { data: maxPosData } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', item.project_id || '')
        .order('backlog_position', { ascending: false })
        .limit(1);
      
      const maxPosition = maxPosData?.[0]?.backlog_position ?? -1;
      
      const { data, error } = await supabase
        .from('backlog_items')
        .insert({
          ...item,
          created_by: user?.id,
          backlog_position: maxPosition + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as BacklogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({ title: 'Backlog item added' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add item', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateBacklogItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BacklogItemUpdate }) => {
      const { data, error } = await supabase
        .from('backlog_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BacklogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteBacklogItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('backlog_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({ title: 'Item deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete item', description: error.message, variant: 'destructive' });
    },
  });
};

export const useReorderBacklogItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; backlog_position: number }[]) => {
      const updates = items.map(item => 
        supabase
          .from('backlog_items')
          .update({ backlog_position: item.backlog_position })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
    },
  });
};
