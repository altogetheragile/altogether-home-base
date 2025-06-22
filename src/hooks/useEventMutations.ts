
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EventData {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location_id?: string;
  instructor_id?: string;
  max_participants?: number;
  price?: number;
  status?: 'draft' | 'published' | 'cancelled';
}

export const useEventMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createEvent = useMutation({
    mutationFn: async (data: EventData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          ...data,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: event, error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUpdateEvents = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<EventData> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: events, error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_by: user.id
        })
        .in('id', ids)
        .select();

      if (error) throw error;
      return events;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Events updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeleteEvents = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Success",
        description: "Events deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    bulkUpdateEvents,
    bulkDeleteEvents,
  };
};
