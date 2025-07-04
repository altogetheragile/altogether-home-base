import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type FormatData = {
  name: string;
};

export const useCreateFormat = () => {
  return useOptimisticCreate({
    queryKey: ['formats'],
    mutationFn: async (data: FormatData) => {
      const { data: format, error } = await supabase
        .from('formats')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating format:', error);
        throw error;
      }

      return format;
    },
    successMessage: "Format created successfully",
    errorMessage: "Failed to create format",
    createTempItem: (data: FormatData) => ({
      id: `temp-${Date.now()}`,
      ...data,
    }),
  });
};

export const useUpdateFormat = () => {
  return useOptimisticUpdate({
    queryKey: ['formats'],
    mutationFn: async ({ id, data }: { id: string; data: FormatData }) => {
      const { data: format, error } = await supabase
        .from('formats')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating format:', error);
        throw error;
      }

      return format;
    },
    successMessage: "Format updated successfully",
    errorMessage: "Failed to update format",
  });
};

export const useDeleteFormat = () => {
  return useOptimisticDelete({
    queryKey: ['formats'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('formats')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting format:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Format deleted successfully",
    errorMessage: "Failed to delete format",
  });
};