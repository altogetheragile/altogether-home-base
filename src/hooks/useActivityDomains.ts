import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityDomain {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useActivityDomains = () => {
  return useQuery({
    queryKey: ['activity-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_domains')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as ActivityDomain[];
    },
  });
};