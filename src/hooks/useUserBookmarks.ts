import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserBookmarks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['user-bookmarks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(`
          *,
          technique:knowledge_items(
            id,
            name,
            slug,
            summary,
            difficulty_level,
            category:knowledge_categories(name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addBookmarkMutation = useMutation({
    mutationFn: async (techniqueId: string) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          technique_id: techniqueId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (techniqueId: string) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('technique_id', techniqueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  const isBookmarked = (techniqueId: string) => {
    return bookmarks?.some(bookmark => bookmark.technique_id === techniqueId) || false;
  };

  const toggleBookmark = (techniqueId: string) => {
    if (isBookmarked(techniqueId)) {
      removeBookmarkMutation.mutate(techniqueId);
    } else {
      addBookmarkMutation.mutate(techniqueId);
    }
  };

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    isToggling: addBookmarkMutation.isPending || removeBookmarkMutation.isPending,
  };
};