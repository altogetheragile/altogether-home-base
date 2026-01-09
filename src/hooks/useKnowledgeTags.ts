import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KnowledgeTag {
  id: string;
  name: string;
  slug: string;
  usage_count?: number;
  created_at: string;
}

export const useKnowledgeTags = () => {
  return useQuery({
    queryKey: ['knowledge-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as KnowledgeTag[] || [];
    },
  });
};

export const useCreateKnowledgeTag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<KnowledgeTag>) => {
      const { data: result, error } = await supabase
        .from('knowledge_tags')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateKnowledgeTag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<KnowledgeTag> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('knowledge_tags')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      toast({
        title: "Success",
        description: "Tag updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteKnowledgeTag = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    },
  });
};
