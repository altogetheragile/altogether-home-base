
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFormats = () => {
  return useQuery({
    queryKey: ['formats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formats')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};
