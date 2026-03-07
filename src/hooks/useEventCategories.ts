import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEventCategories = () => {
  return useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_categories')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};