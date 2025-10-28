import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { auditLogger } from "@/utils/auditLogger";

// PostgreSQL error type
interface PostgreSQLError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Network error detection utility
const isNetworkError = (error: any): boolean => {
  return (
    error.message?.includes('network') ||
    error.message?.includes('connection') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Load failed') ||
    error.message?.includes('access control') ||
    error.code === 'NETWORK_ERROR' ||
    !navigator.onLine
  );
};

// Retry logic utility
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export interface KnowledgeItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  planning_focus_id?: string;
  domain_id?: string;
  source?: string;
  background?: string;
  author?: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  has_ai_support?: boolean;
  
  // Enhanced fields
  common_pitfalls?: string[];
  evidence_sources?: string[];
  key_terminology?: Record<string, any>;
  learning_value_summary?: string;
  related_techniques?: string[];
  
  // Normalized publication reference
  primary_publication_id?: string;
  
  // Relations
  knowledge_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    description?: string;
  };
  planning_focuses?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    display_order: number;
    description?: string;
  };
  activity_domains?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    description?: string;
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
  knowledge_item_tags?: Array<{
    knowledge_tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  publications?: {
    id: string;
    title: string;
    publication_type: string;
    url?: string;
    publication_year?: number;
    publisher?: string;
    publication_authors?: Array<{
      authors: {
        id: string;
        name: string;
      };
    }>;
  };
  knowledge_item_references?: Array<{
    id: string;
    reference_type: string;
    page_reference?: string;
    excerpt?: string;
    publications: {
      id: string;
      title: string;
      publication_type: string;
      url?: string;
      publication_authors?: Array<{
        authors: {
          id: string;
          name: string;
        };
      }>;
    };
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
  showUnpublished?: boolean;
}) => {
  return useQuery({
    queryKey: ['knowledge-items', params],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color, description),
          planning_focuses (id, name, slug, color, display_order, description),
          activity_domains (id, name, slug, color, description),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          ),
          publications (
            id, title, publication_type, url, publication_year, publisher,
            publication_authors (
              authors (id, name)
            )
          ),
          knowledge_item_references (
            id, reference_type, page_reference, excerpt,
            publications (
              id, title, publication_type, url,
              publication_authors (
                authors (id, name)
              )
            )
          )
        `);

      // Only filter by published status if not explicitly requesting unpublished items
      if (!params?.showUnpublished) {
        query = query.eq('is_published', true);
      }

      if (params?.search && params.search.length >= 2) {
        const searchTerm = params.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }

      if (params?.layerId) {
        query = query.eq('planning_focus_id', params.layerId);
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
        case 'planning_focus':
          query = query.order('planning_focuses(display_order)', { ascending: true })
                       .order('planning_focuses(name)', { ascending: true });
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

export const useKnowledgeItemById = (id: string) => {
  return useQuery({
    queryKey: ['knowledge-item-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          id, name, slug, description,
          knowledge_categories (id, name, color),
          activity_domains (id, name, color),
          planning_focuses (id, name, color),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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
          planning_focuses (id, name, slug, color, display_order),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          ),
          publications (
            id, title, publication_type, url, publication_year, publisher,
            publication_authors (
              authors (id, name)
            )
          ),
          knowledge_item_references (
            id, reference_type, page_reference, excerpt,
            publications (
              id, title, publication_type, url,
              publication_authors (
                authors (id, name)
              )
            )
          )
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
      console.log('🚀 useCreateKnowledgeItem: Starting creation with data:', JSON.stringify(data, null, 2));
      
        // Transform data similarly to update mutation
        const transformedData = {
          ...data,
          category_id: data.category_id === '' ? null : data.category_id,
          planning_focus_id: data.planning_focus_id === '' ? null : data.planning_focus_id,
          domain_id: data.domain_id === '' ? null : data.domain_id,
          primary_publication_id: data.primary_publication_id === '' || data.primary_publication_id === undefined ? null : data.primary_publication_id,
        };
      
      // Retry the create operation for network errors
      return retryWithBackoff(async () => {
        const { data: result, error } = await supabase
          .from('knowledge_items')
          .insert([transformedData])
          .select()
          .single();

        if (error) {
          console.error('❌ useCreateKnowledgeItem: Insert failed:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('✅ useCreateKnowledgeItem: Creation successful:', result);
        return result;
      });
    },
    onSuccess: (result) => {
      console.log('🎉 useCreateKnowledgeItem: Success callback:', result);
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      
      // Log knowledge item creation
      auditLogger.create('knowledge_items', result.id, {
        item_name: result.name,
        is_published: result.is_published,
        category_id: result.category_id
      }).catch(console.error);
      
      toast({
        title: "Success",
        description: "Knowledge item created successfully",
      });
    },
    onError: (error: PostgreSQLError) => {
      console.error('❌ useCreateKnowledgeItem: Error callback:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to create knowledge item";
      
      if (isNetworkError(error)) {
        errorMessage = "Network connection lost. Please check your internet connection and try again.";
      } else if (error.code === '23502') {
        errorMessage = `Missing required field: ${error.details}`;
      } else if (error.code === '23503') {
        errorMessage = `Invalid reference: ${error.details}`;
      } else if (error.code === '23505') {
        errorMessage = `Duplicate value: ${error.details}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error creating knowledge item",
        description: errorMessage,
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
        // Transform data to handle empty strings and invalid values
        const transformedData = {
          ...data,
          // Convert empty strings to null for UUID fields
          category_id: data.category_id === '' ? null : data.category_id,
          planning_focus_id: data.planning_focus_id === '' ? null : data.planning_focus_id,
          domain_id: data.domain_id === '' ? null : data.domain_id,
          // Convert empty string publication reference to null
          primary_publication_id: data.primary_publication_id === '' || data.primary_publication_id === undefined ? null : data.primary_publication_id,
        };

      console.log('💾 Sending data to Supabase:', transformedData);

      // Retry the update operation for network errors
      return retryWithBackoff(async () => {
        const { data: result, error } = await supabase
          .from('knowledge_items')
          .update(transformedData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        return result;
      });
    },
    onMutate: async ({ id, ...data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['knowledge-item', id] });
      await queryClient.cancelQueries({ queryKey: ['knowledge-items'] });

      // Snapshot the previous value
      const previousItem = queryClient.getQueryData(['knowledge-item', id]);

      // Optimistically update the cache
      if (previousItem) {
        const optimisticUpdate = { ...(previousItem as KnowledgeItem), ...data, updated_at: new Date().toISOString() };
        queryClient.setQueryData(['knowledge-item', id], optimisticUpdate);
      }

      return { previousItem };
    },
    onSuccess: (result, { id }) => {
      console.log('✅ Update mutation success, updating cache...');
      // Update cache with actual server response
      queryClient.setQueryData(['knowledge-item', id], result);
      // Use setQueryData for list cache instead of invalidation to prevent re-renders
      const listData = queryClient.getQueryData(['knowledge-items']);
      if (listData && Array.isArray(listData)) {
        const updatedList = listData.map((item: any) => 
          item.id === id ? result : item
        );
        queryClient.setQueryData(['knowledge-items'], updatedList);
      }
      
      // Log knowledge item update
      auditLogger.update('knowledge_items', id, {
        item_name: result.name,
        is_published: result.is_published
      }).catch(console.error);
      
      toast({
        title: "Success",
        description: "Knowledge item updated successfully",
      });
    },
    onError: (error: PostgreSQLError, { id }, context) => {
      console.error('❌ Update mutation failed:', error);
      
      // Rollback optimistic update
      if (context?.previousItem) {
        queryClient.setQueryData(['knowledge-item', id], context.previousItem);
      }
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to update knowledge item";
      let action = undefined;
      
      if (isNetworkError(error)) {
        errorMessage = "Network connection lost. Please check your internet connection and try again.";
      } else if (error.code === '23502') {
        errorMessage = `Missing required field: ${error.details}`;
      } else if (error.code === '23503') {
        errorMessage = `Invalid reference: ${error.details}`;
      } else if (error.code === '23505') {
        errorMessage = `Duplicate value: ${error.details}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        action,
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      
      // Log knowledge item deletion
      auditLogger.delete('knowledge_items', id, {
        context: 'permanent_deletion'
      }).catch(console.error);
      
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