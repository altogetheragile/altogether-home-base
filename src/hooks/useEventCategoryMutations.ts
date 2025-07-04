import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type EventCategoryData = {
  name: string;
};

export const useCreateEventCategory = () => {
  return useOptimisticCreate({
    queryKey: ['event-categories'],
    mutationFn: async (data: EventCategoryData) => {
      const { data: category, error } = await supabase
        .from('event_categories')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating event category:', error);
        throw error;
      }

      return category;
    },
    successMessage: "Event category created successfully",
    errorMessage: "Failed to create event category",
    createTempItem: (data: EventCategoryData) => ({
      id: `temp-${Date.now()}`,
      ...data,
    }),
  });
};

export const useUpdateEventCategory = () => {
  return useOptimisticUpdate({
    queryKey: ['event-categories'],
    mutationFn: async ({ id, data }: { id: string; data: EventCategoryData }) => {
      const { data: category, error } = await supabase
        .from('event_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event category:', error);
        throw error;
      }

      return category;
    },
    successMessage: "Event category updated successfully",
    errorMessage: "Failed to update event category",
  });
};

export const useDeleteEventCategory = () => {
  return useOptimisticDelete({
    queryKey: ['event-categories'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event category:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Event category deleted successfully",
    errorMessage: "Failed to delete event category",
  });
};