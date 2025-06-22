
import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type InstructorData = {
  name: string;
  bio: string;
};

export const useCreateInstructor = () => {
  return useOptimisticCreate({
    queryKey: ['instructors'],
    mutationFn: async (data: InstructorData) => {
      const { data: instructor, error } = await supabase
        .from('instructors')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating instructor:', error);
        throw error;
      }

      return instructor;
    },
    successMessage: "Instructor created successfully",
    errorMessage: "Failed to create instructor",
    createTempItem: (data: InstructorData) => ({
      id: `temp-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
  });
};

export const useUpdateInstructor = () => {
  return useOptimisticUpdate({
    queryKey: ['instructors'],
    mutationFn: async ({ id, data }: { id: string; data: InstructorData }) => {
      const { data: instructor, error } = await supabase
        .from('instructors')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating instructor:', error);
        throw error;
      }

      return instructor;
    },
    successMessage: "Instructor updated successfully",
    errorMessage: "Failed to update instructor",
  });
};

export const useDeleteInstructor = () => {
  return useOptimisticDelete({
    queryKey: ['instructors'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting instructor:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Instructor deleted successfully",
    errorMessage: "Failed to delete instructor",
  });
};
