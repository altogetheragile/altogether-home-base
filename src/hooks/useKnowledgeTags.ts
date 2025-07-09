import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeTag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export const useKnowledgeTags = (limit?: number) => {
  return useQuery({
    queryKey: ['knowledge-tags', limit],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KnowledgeTag[];
    },
  });
};