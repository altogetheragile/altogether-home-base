import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useKnowledgeItemComments = (knowledgeItemId: string) => {
  // Fetch comment count
  const { data: commentCount = 0 } = useQuery({
    queryKey: ['knowledge-item-comments', knowledgeItemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('knowledge_item_comments')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_item_id', knowledgeItemId);

      if (error) throw error;
      return count || 0;
    },
  });

  return {
    commentCount,
  };
};
