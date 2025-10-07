import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useKnowledgeItemLikes = (knowledgeItemId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch like count
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['knowledge-item-likes', knowledgeItemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('knowledge_item_likes')
        .select('*', { count: 'exact', head: true })
        .eq('knowledge_item_id', knowledgeItemId);

      if (error) throw error;
      return count || 0;
    },
  });

  // Check if current user has liked
  const { data: hasLiked = false } = useQuery({
    queryKey: ['knowledge-item-user-like', knowledgeItemId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('knowledge_item_likes')
        .select('id')
        .eq('knowledge_item_id', knowledgeItemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to like');

      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from('knowledge_item_likes')
          .delete()
          .eq('knowledge_item_id', knowledgeItemId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('knowledge_item_likes')
          .insert({
            knowledge_item_id: knowledgeItemId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-likes', knowledgeItemId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-user-like', knowledgeItemId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message === 'Must be logged in to like' 
          ? "Please log in to like items" 
          : "Failed to update like",
        variant: "destructive",
      });
    },
  });

  return {
    likeCount,
    hasLiked,
    toggleLike: toggleLike.mutate,
    isLoading: toggleLike.isPending,
  };
};
