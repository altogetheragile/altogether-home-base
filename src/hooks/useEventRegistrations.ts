
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

export interface AdminRegistrationUser {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface AdminRegistrationWithUser extends AdminRegistration {
  user: AdminRegistrationUser | null;
}

export const useEventRegistrations = (eventId?: string) => {
  return useQuery<AdminRegistrationWithUser[]>({
    queryKey: ['event-registrations', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return [];

      // Fetch registrations for the event
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, user_id, registered_at, payment_status, stripe_session_id')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }

      const registrations = data || [];
      if (registrations.length === 0) return [];

      // Collect unique user IDs
      const userIds = Array.from(
        new Set(
          registrations
            .map((r) => r.user_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );

      // If there are no user IDs, just return registrations with null user
      if (userIds.length === 0) {
        return registrations.map((r) => ({ ...r, user: null }));
      }

      // Fetch profiles for these user IDs (admins can view all profiles via RLS policy)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      const profileMap = new Map<string, AdminRegistrationUser>(
        (profiles || []).map((p) => [p.id as string, { id: p.id as string, full_name: p.full_name ?? null, email: p.email ?? null }])
      );

      // Merge registrations with profiles
      const enriched: AdminRegistrationWithUser[] = registrations.map((r) => ({
        ...r,
        user: r.user_id ? profileMap.get(r.user_id) ?? null : null,
      }));

      return enriched;
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
