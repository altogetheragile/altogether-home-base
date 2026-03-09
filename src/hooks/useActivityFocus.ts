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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- activity_focus not in generated Supabase types
      const { data, error } = await supabase
        .from('activity_focus' as any)
        .select('*')
        .order('name');

      if (error) throw error;
      return data as unknown as ActivityFocus[];
    },
  });
};