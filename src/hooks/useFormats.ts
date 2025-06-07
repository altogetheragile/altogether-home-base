
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFormats = () => {
  return useQuery({
    queryKey: ['formats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formats')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching formats:', error);
        throw error;
      }

      return data || [];
    },
  });
};
