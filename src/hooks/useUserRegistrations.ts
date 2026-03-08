
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BasicRegistration {
  id: string;
  event_id: string | null;
  registered_at: string | null;
  payment_status: string | null;
  stripe_session_id: string | null;
}

export interface EventDetails {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  price_cents: number | null;
  currency: string | null;
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

      // STEP 1: Fetch user's raw registrations
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, registered_at, payment_status, stripe_session_id')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!registrations || registrations.length === 0) return [];

      // STEP 2: Fetch related events in one query
      const eventIds = registrations.map(r => r.event_id).filter((id): id is string => id !== null);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_date, end_date, price_cents, currency, instructor_id')
        .in('id', eventIds);

      if (eventsError) {
        throw eventsError;
      }

      // STEP 3: Join registrations with events
      const eventMap = new Map(eventsData?.map(e => [e.id, {
        ...e,
        price_cents: e.price_cents ?? 0,
        currency: e.currency ?? 'usd',
      } as EventDetails]) || []);
      const enriched: UserRegistrationWithEvent[] = registrations.map(reg => ({
        id: reg.id,
        event_id: reg.event_id ?? '',
        registered_at: reg.registered_at ?? '',
        payment_status: reg.payment_status ?? '',
        stripe_session_id: reg.stripe_session_id,
        event: reg.event_id ? (eventMap.get(reg.event_id) ?? null) : null,
      }));

      return enriched;
    }
  });
};
