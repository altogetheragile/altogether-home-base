
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BasicRegistration {
  id: string;
  event_id: string;
  registered_at: string;
  payment_status: string;
  stripe_session_id: string | null;
}

export interface EventDetails {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  price_cents: number;
  currency: string;
  instructor_id: string | null;
}

export interface UserRegistrationWithEvent extends BasicRegistration {
  event: EventDetails | null;
}

export const useUserRegistrations = () => {
  const { user } = useAuth();

  return useQuery<UserRegistrationWithEvent[]>({
    queryKey: ['user-registrations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching registrations for user:', user.id);

      // STEP 1: Fetch user's raw registrations
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, registered_at, payment_status, stripe_session_id')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        throw error;
      }

      console.log('Raw registrations fetched:', registrations?.length || 0);

      if (!registrations || registrations.length === 0) return [];

      // STEP 2: Fetch related events in one query
      const eventIds = registrations.map(r => r.event_id).filter(Boolean);
      console.log('Fetching events for IDs:', eventIds);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_date, end_date, price_cents, currency, instructor_id')
        .in('id', eventIds);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        throw eventsError;
      }

      console.log('Events fetched:', eventsData?.length || 0);

      // STEP 3: Join registrations with events
      const eventMap = new Map(eventsData?.map(e => [e.id, e]) || []);
      const enriched = registrations.map(reg => ({
        ...reg,
        event: eventMap.get(reg.event_id) || null,
      }));

      console.log('Final enriched registrations:', enriched.length);
      return enriched;
    }
  });
};
