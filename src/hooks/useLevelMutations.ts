import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type LevelData = {
  name: string;
};

export const useCreateLevel = () => {
  return useOptimisticCreate({
    queryKey: ['levels'],
    mutationFn: async (data: LevelData) => {
      const { data: level, error } = await supabase
        .from('levels')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating level:', error);
        throw error;
      }

      return level;
    },
    successMessage: "Level created successfully",
    errorMessage: "Failed to create level",
    createTempItem: (data: LevelData) => ({
      id: `temp-${Date.now()}`,
      ...data,
    }),
  });
};

export const useUpdateLevel = () => {
  return useOptimisticUpdate({
    queryKey: ['levels'],
    mutationFn: async ({ id, data }: { id: string; data: LevelData }) => {
      const { data: level, error } = await supabase
        .from('levels')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating level:', error);
        throw error;
      }

      return level;
    },
    successMessage: "Level updated successfully",
    errorMessage: "Failed to update level",
  });
};

export const useDeleteLevel = () => {
  return useOptimisticDelete({
    queryKey: ['levels'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('levels')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting level:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Level deleted successfully",
    errorMessage: "Failed to delete level",
  });
};