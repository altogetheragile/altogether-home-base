import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_types')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};