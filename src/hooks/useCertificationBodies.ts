import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCertificationBodies = () => {
  return useQuery({
    queryKey: ['certification_bodies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_bodies')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};
