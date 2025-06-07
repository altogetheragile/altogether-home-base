
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRegistration {
  id: string;
  registered_at: string;
  payment_status: string;
  stripe_session_id: string | null;
  event: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    price_cents: number;
    currency: string;
    instructor: {
      name: string;
      bio: string | null;
    } | null;
    location: {
      name: string;
      address: string | null;
      virtual_url: string | null;
    } | null;
    event_template: {
      duration_days: number | null;
      event_types: {
        name: string;
      } | null;
      formats: {
        name: string;
      } | null;
      levels: {
        name: string;
      } | null;
    } | null;
  };
}

// Type for the raw Supabase response - matches actual structure where joins return arrays
interface RawRegistrationResponse {
  id: string;
  registered_at: string;
  payment_status: string;
  stripe_session_id: string | null;
  event_id: string;
  event: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    price_cents: number;
    currency: string;
    instructor: {
      name: string;
      bio: string | null;
    }[];
    location: {
      name: string;
      address: string | null;
      virtual_url: string | null;
    }[];
    event_templates: {
      duration_days: number | null;
      event_types: {
        name: string;
      } | null;
      formats: {
        name: string;
      } | null;
      levels: {
        name: string;
      } | null;
    }[] | null;
  }[];
}

export const useUserRegistrations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-registrations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          registered_at,
          payment_status,
          stripe_session_id,
          event_id,
          event:events!inner(
            id,
            title,
            description,
            start_date,
            end_date,
            price_cents,
            currency,
            instructor:instructors(name, bio),
            location:locations(name, address, virtual_url),
            event_templates(
              duration_days,
              event_types(name),
              formats(name),
              levels(name)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching user registrations:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedData: UserRegistration[] = (data as RawRegistrationResponse[] || []).map(registration => {
        // Access the first event from the array (since we're using inner join, there should be exactly one)
        const eventData = registration.event[0];
        
        return {
          id: registration.id,
          registered_at: registration.registered_at,
          payment_status: registration.payment_status,
          stripe_session_id: registration.stripe_session_id,
          event: {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            start_date: eventData.start_date,
            end_date: eventData.end_date,
            price_cents: eventData.price_cents || 0,
            currency: eventData.currency || 'usd',
            instructor: eventData.instructor?.[0] || null,
            location: eventData.location?.[0] || null,
            event_template: eventData.event_templates?.[0] ? {
              duration_days: eventData.event_templates[0].duration_days,
              event_types: eventData.event_templates[0].event_types || null,
              formats: eventData.event_templates[0].formats || null,
              levels: eventData.event_templates[0].levels || null,
            } : null,
          }
        };
      });

      return transformedData;
    },
    enabled: !!user,
  });
};
