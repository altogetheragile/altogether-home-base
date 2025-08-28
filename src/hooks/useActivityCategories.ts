import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useActivityCategories = () => {
  return useQuery({
    queryKey: ['activity-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as ActivityCategory[];
    },
  });
};