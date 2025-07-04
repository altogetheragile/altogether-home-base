import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching event types:', error);
        throw error;
      }

      return data || [];
    },
  });
};