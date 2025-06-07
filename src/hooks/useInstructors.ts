
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInstructors = () => {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching instructors:', error);
        throw error;
      }

      return data || [];
    },
  });
};
