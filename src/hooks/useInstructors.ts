
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInstructors = () => {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};
