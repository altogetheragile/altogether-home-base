import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLevels = () => {
  return useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};