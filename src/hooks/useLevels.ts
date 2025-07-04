import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLevels = () => {
  return useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching levels:', error);
        throw error;
      }

      return data || [];
    },
  });
};