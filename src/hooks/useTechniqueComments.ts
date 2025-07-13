import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TechniqueComment {
  id: string;
  technique_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_approved: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name?: string;
    email?: string;
  };
  user_vote?: {
    vote_type: 'up' | 'down';
  };
  replies?: TechniqueComment[];
}

export const useTechniqueComments = (techniqueId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['technique-comments', techniqueId, user?.id],
    queryFn: async () => {
      // Build the select query dynamically
      let selectQuery = `
        *,
        user_profile:profiles!inner(full_name, email)
      `;
      
      if (user?.id) {
        selectQuery += `, user_vote:comment_votes!left(vote_type)`;
      }

      const { data, error } = await supabase
        .from('technique_comments')
        .select(selectQuery)
        .eq('technique_id', techniqueId)
        .eq('is_approved', true)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment: any) => {
          const { data: replies, error: repliesError } = await supabase
            .from('technique_comments')
            .select(selectQuery)
            .eq('parent_comment_id', comment.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;

          return {
            ...comment,
            replies: replies || [],
          };
        })
      );

      return commentsWithReplies;
    },
    enabled: !!techniqueId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ 
      content, 
      parentCommentId 
    }: { 
      content: string; 
      parentCommentId?: string 
    }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('technique_comments')
        .insert({
          technique_id: techniqueId,
          user_id: user.id,
          parent_comment_id: parentCommentId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technique-comments', techniqueId] });
    },
  });

  const voteCommentMutation = useMutation({
    mutationFn: async ({ 
      commentId, 
      voteType 
    }: { 
      commentId: string; 
      voteType: 'up' | 'down' 
    }) => {
      if (!user?.id) throw new Error('No user');

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          await supabase
            .from('comment_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote if different type
          await supabase
            .from('comment_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Add new vote
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType,
          });
      }

      // Update comment vote counts
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId);

      const upvotes = votes?.filter(v => v.vote_type === 'up').length || 0;
      const downvotes = votes?.filter(v => v.vote_type === 'down').length || 0;

      await supabase
        .from('technique_comments')
        .update({ upvotes, downvotes })
        .eq('id', commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technique-comments', techniqueId] });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    voteComment: voteCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    isVoting: voteCommentMutation.isPending,
  };
};