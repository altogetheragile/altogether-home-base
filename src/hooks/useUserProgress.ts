import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProgress {
  id: string;
  technique_id: string;
  status: 'unread' | 'reading' | 'read' | 'applied' | 'mastered';
  started_at?: string;
  completed_at?: string;
  time_spent_seconds: number;
}

export const useUserProgress = (techniqueId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['user-progress', user?.id, techniqueId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      let query = supabase
        .from('user_reading_progress')
        .select('*')
        .eq('user_id', user.id);

      if (techniqueId) {
        query = query.eq('technique_id', techniqueId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return techniqueId ? data?.[0] : data;
    },
    enabled: !!user?.id,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ 
      techniqueId, 
      status, 
      timeSpent 
    }: { 
      techniqueId: string; 
      status: UserProgress['status']; 
      timeSpent?: number 
    }) => {
      if (!user?.id) throw new Error('No user');

      const updateData: any = {
        user_id: user.id,
        technique_id: techniqueId,
        status,
        updated_at: new Date().toISOString(),
      };

      if (status !== 'unread' && !progress?.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === 'read' || status === 'applied' || status === 'mastered') {
        updateData.completed_at = new Date().toISOString();
      }

      if (timeSpent !== undefined) {
        updateData.time_spent_seconds = (progress?.time_spent_seconds || 0) + timeSpent;
      }

      const { data, error } = await supabase
        .from('user_reading_progress')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });

  return {
    progress,
    isLoading,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
  };
};