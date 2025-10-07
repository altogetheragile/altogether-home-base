import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface KnowledgeItemComment {
  id: string;
  knowledge_item_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username?: string;
    full_name?: string;
    email?: string;
  };
}

export const useKnowledgeItemComments = (knowledgeItemId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all comments with user profiles
  const { data: comments, isLoading } = useQuery({
    queryKey: ['knowledge-item-comments', knowledgeItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_item_comments')
        .select('*')
        .eq('knowledge_item_id', knowledgeItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeItemComment[];
    },
    enabled: !!knowledgeItemId,
  });

  // Comment count
  const commentCount = comments?.length || 0;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to comment');
      }

      const { data, error } = await supabase
        .from('knowledge_item_comments')
        .insert({
          knowledge_item_id: knowledgeItemId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-comments', knowledgeItemId] });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!user?.id) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('knowledge_item_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-comments', knowledgeItemId] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('User must be authenticated');

      const { error } = await supabase
        .from('knowledge_item_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-comments', knowledgeItemId] });
    },
  });

  return {
    comments,
    commentCount,
    isLoading,
    addComment: addCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
    isUpdatingComment: updateCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
