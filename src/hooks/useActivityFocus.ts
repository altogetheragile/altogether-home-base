import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityFocus {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useActivityFocus = () => {
  return useQuery({
    queryKey: ['activity-focus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_focus')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as ActivityFocus[];
    },
  });
};