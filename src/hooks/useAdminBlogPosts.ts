import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { BlogPost } from '@/hooks/useBlogPosts';

export interface BlogPostData {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  category_id?: string;
  is_published?: boolean;
  is_featured?: boolean;
  estimated_reading_time?: number;
  seo_title?: string;
  seo_description?: string;
  published_at?: string | null;
}

export const useAdminBlogPosts = () => {
  return useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug,
            color
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BlogPost[];
    },
  });
};

export const useAdminBlogPost = (id: string) => {
  return useQuery({
    queryKey: ['admin-blog-post', id],
    queryFn: async (): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug,
            color
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as unknown as BlogPost;
    },
    enabled: !!id,
  });
};

export const useBlogPostMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
  };

  const createPost = useMutation({
    mutationFn: async (data: BlogPostData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          ...data,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: 'Success', description: 'Blog post created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogPostData> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data: post, error } = await supabase
        .from('blog_posts')
        .update({
          ...data,
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: 'Success', description: 'Blog post updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: 'Success', description: 'Blog post deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const newPublished = !is_published;
      const { data: post, error } = await supabase
        .from('blog_posts')
        .update({
          is_published: newPublished,
          published_at: newPublished ? new Date().toISOString() : null,
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: (data) => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['admin-blog-post', data.id] });
      toast({
        title: 'Success',
        description: data.is_published ? 'Post published' : 'Post unpublished',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { createPost, updatePost, deletePost, togglePublished };
};
