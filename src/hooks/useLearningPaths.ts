import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningPath {
  id: string;
  title: string;
  description?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes?: number;
  is_published: boolean;
  created_by?: string;
  steps?: LearningPathStep[];
  user_progress?: UserLearningPathProgress;
}

export interface LearningPathStep {
  id: string;
  path_id: string;
  technique_id: string;
  step_order: number;
  description?: string;
  estimated_minutes: number;
  is_optional: boolean;
  technique?: {
    id: string;
    name: string;
    slug: string;
    summary?: string;
    difficulty_level?: string;
  };
}

export interface UserLearningPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_step_id?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  started_at?: string;
  completed_at?: string;
  completion_percentage: number;
}

export const useLearningPaths = () => {
  const { user } = useAuth();

  const { data: paths, isLoading } = useQuery({
    queryKey: ['learning-paths', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  return {
    paths,
    isLoading,
  };
};

export const useLearningPathProgress = (pathId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['learning-path-progress', user?.id, pathId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('path_id', pathId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && !!pathId,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ 
      status, 
      currentStepId, 
      completionPercentage 
    }: { 
      status?: UserLearningPathProgress['status']; 
      currentStepId?: string; 
      completionPercentage?: number 
    }) => {
      if (!user?.id) throw new Error('No user');

      const updateData: any = {
        user_id: user.id,
        path_id: pathId,
        updated_at: new Date().toISOString(),
      };

      if (status !== undefined) {
        updateData.status = status;
        if (status === 'in_progress' && !progress?.started_at) {
          updateData.started_at = new Date().toISOString();
        }
        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
          updateData.completion_percentage = 100;
        }
      }

      if (currentStepId !== undefined) {
        updateData.current_step_id = currentStepId;
      }

      if (completionPercentage !== undefined) {
        updateData.completion_percentage = completionPercentage;
      }

      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path-progress'] });
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
    },
  });

  return {
    progress,
    isLoading,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
  };
};