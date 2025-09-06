import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Publication {
  id: string;
  title: string;
  publication_type: 'book' | 'article' | 'paper' | 'website' | 'blog' | 'video' | 'podcast' | 'other';
  url?: string;
  isbn?: string;
  doi?: string;
  publication_year?: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;
  keywords?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relations
  publication_authors?: Array<{
    author_id: string;
    author_order: number;
    role: string;
    authors: {
      id: string;
      name: string;
    };
  }>;
}

export const usePublications = () => {
  return useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          publication_authors (
            author_id,
            author_order,
            role,
            authors (id, name)
          )
        `)
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreatePublication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Publication>) => {
      const { data: result, error } = await supabase
        .from('publications')
        .insert([{ ...data, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast({
        title: "Success",
        description: "Publication created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create publication",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePublication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Publication> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('publications')
        .update({ ...data, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast({
        title: "Success",
        description: "Publication updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update publication",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePublication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      toast({
        title: "Success",
        description: "Publication deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete publication",
        variant: "destructive",
      });
    },
  });
};