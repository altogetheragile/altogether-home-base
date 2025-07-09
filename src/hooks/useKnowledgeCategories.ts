import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeCategories = () => {
  return useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });
};