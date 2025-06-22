
import { supabase } from '@/integrations/supabase/client';
import { useOptimisticCreate, useOptimisticUpdate, useOptimisticDelete } from './useOptimisticMutation';

type EventData = {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location_id?: string;
  instructor_id?: string;
  price_cents?: number;
  currency?: string;
  is_published?: boolean;
};

export const useCreateEvent = () => {
  return useOptimisticCreate({
    queryKey: ['events'],
    mutationFn: async (data: EventData) => {
      const { data: event, error } = await supabase
        .from('events')
        .insert([{
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        throw error;
      }

      return event;
    },
    successMessage: "Event created successfully",
    errorMessage: "Failed to create event",
    createTempItem: (data: EventData) => ({
      id: `temp-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
  });
};

export const useUpdateEvent = () => {
  return useOptimisticUpdate({
    queryKey: ['events'],
    mutationFn: async ({ id, data }: { id: string; data: EventData }) => {
      const { data: event, error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }

      return event;
    },
    successMessage: "Event updated successfully",
    errorMessage: "Failed to update event",
  });
};

export const useDeleteEvent = () => {
  return useOptimisticDelete({
    queryKey: ['events'],
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }

      return { success: true };
    },
    successMessage: "Event deleted successfully",
    errorMessage: "Failed to delete event",
  });
};

export const useBulkUpdateEvents = () => {
  return useOptimisticUpdate({
    queryKey: ['events'],
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<EventData> }) => {
      const { data: events, error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .in('id', ids)
        .select();

      if (error) {
        console.error('Error bulk updating events:', error);
        throw error;
      }

      return events;
    },
    successMessage: "Events updated successfully",
    errorMessage: "Failed to update events",
  });
};
