import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KnowledgeItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  planning_layer_id?: string;
  domain_id?: string;
  source?: string;
  background?: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relations
  knowledge_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  planning_layers?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    display_order: number;
  };
  activity_domains?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  knowledge_use_cases?: Array<{
    id: string;
    case_type: 'generic' | 'example';
    title?: string;
    who?: string;
    what?: string;
    when_used?: string;
    where_used?: string;
    why?: string;
    how?: string;
    how_much?: string;
    summary?: string;
  }>;
}

export const useKnowledgeItems = (params?: {
  search?: string;
  categoryId?: string;
  layerId?: string;
  domainId?: string;
  featured?: boolean;
  limit?: number;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: ['knowledge-items', params],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_layers (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
        `)
        .eq('is_published', true);

      if (params?.search && params.search.length >= 2) {
        const searchTerm = params.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }

      if (params?.layerId) {
        query = query.eq('planning_layer_id', params.layerId);
      }

      if (params?.domainId) {
        query = query.eq('domain_id', params.domainId);
      }

      if (params?.featured) {
        query = query.eq('is_featured', true);
      }

      switch (params?.sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        case 'popularity':
        default:
          query = query.order('view_count', { ascending: false })
                       .order('created_at', { ascending: false });
          break;
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useKnowledgeItemBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['knowledge-item', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_layers (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useCreateKnowledgeItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<KnowledgeItem>) => {
      const { data: result, error } = await supabase
        .from('knowledge_items')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      toast({
        title: "Success",
        description: "Knowledge item created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create knowledge item",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateKnowledgeItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<KnowledgeItem> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('knowledge_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      toast({
        title: "Success",
        description: "Knowledge item updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update knowledge item",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteKnowledgeItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      toast({
        title: "Success",
        description: "Knowledge item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete knowledge item",
        variant: "destructive",
      });
    },
  });
};