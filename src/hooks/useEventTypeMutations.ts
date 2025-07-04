import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type EventTypeData = {
  name: string;
};

export const useCreateEventType = () => {
  return useOptimisticCreate({
    queryKey: ['event-types'],
    mutationFn: async (data: EventTypeData) => {
      const { data: eventType, error } = await supabase
        .from('event_types')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating event type:', error);
        throw error;
      }

      return eventType;
    },
    successMessage: "Event type created successfully",
    errorMessage: "Failed to create event type",
    createTempItem: (data: EventTypeData) => ({
      id: `temp-${Date.now()}`,
      ...data,
    }),
  });
};

export const useUpdateEventType = () => {
  return useOptimisticUpdate({
    queryKey: ['event-types'],
    mutationFn: async ({ id, data }: { id: string; data: EventTypeData }) => {
      const { data: eventType, error } = await supabase
        .from('event_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event type:', error);
        throw error;
      }

      return eventType;
    },
    successMessage: "Event type updated successfully",
    errorMessage: "Failed to update event type",
  });
};

export const useDeleteEventType = () => {
  return useOptimisticDelete({
    queryKey: ['event-types'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event type:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Event type deleted successfully",
    errorMessage: "Failed to delete event type",
  });
};