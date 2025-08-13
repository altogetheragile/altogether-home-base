
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminRegistration {
  id: string;
  event_id: string | null;
  user_id: string | null;
  registered_at: string | null;
  payment_status: string | null;
  stripe_session_id: string | null;
}

export const useEventRegistrations = (eventId?: string) => {
  return useQuery<AdminRegistration[]>({
    queryKey: ['event-registrations', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, user_id, registered_at, payment_status, stripe_session_id')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }
      return data || [];
    },
  });
};

export const useDeleteRegistration = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) {
        throw error;
      }
      return registrationId;
    },
    onSuccess: () => {
      // Refresh the registrations list and the admin events (counts)
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });

      toast({
        title: 'Registration deleted',
        description: 'The registration has been removed from this event.',
      });
    },
    onError: (error: any) => {
      console.error('Delete registration error:', error);
      toast({
        title: 'Failed to delete registration',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });
};
