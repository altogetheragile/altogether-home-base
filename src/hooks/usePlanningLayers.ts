import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanningLayer {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const usePlanningLayers = () => {
  return useQuery({
    queryKey: ['planning-layers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_layers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as PlanningLayer[];
    },
  });
};