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

// Taxonomy item types
export interface DecisionLevel {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
}

export interface ActivityDomain {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  slug: string;
}

export interface KnowledgeItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  
  // Visual fields
  icon?: string;
  emoji?: string;
  
  // Enhanced fields
  common_pitfalls?: string[];
  evidence_sources?: string[];
  key_terminology?: Record<string, any>;
  learning_value_summary?: string;
  related_techniques?: string[];
  
  // Normalized publication reference
  primary_publication_id?: string;
  
  // Legacy single FK fields (deprecated - use arrays below)
  category_id?: string;
  planning_focus_id?: string;
  domain_id?: string;
  
  // NEW: Multi-select taxonomy arrays
  decision_levels: DecisionLevel[];
  categories: KnowledgeCategory[];
  domains: ActivityDomain[];
  tags: KnowledgeTag[];
  
  // Legacy single relations (deprecated)
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
  
  // Other relations
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

// Transform raw database response to KnowledgeItem with taxonomy arrays
const transformKnowledgeItem = (raw: any): KnowledgeItem => {
  // Extract decision levels from junction table
  const decision_levels: DecisionLevel[] = (raw.knowledge_item_decision_levels || [])
    .map((jt: any) => jt.decision_levels)
    .filter(Boolean);

  // Extract categories from junction table
  const categories: KnowledgeCategory[] = (raw.knowledge_item_categories || [])
    .map((jt: any) => jt.knowledge_categories)
    .filter(Boolean);

  // Extract domains from junction table
  const domains: ActivityDomain[] = (raw.knowledge_item_domains || [])
    .map((jt: any) => jt.activity_domains)
    .filter(Boolean);

  // Extract tags from junction table
  const tags: KnowledgeTag[] = (raw.knowledge_item_tags || [])
    .map((jt: any) => jt.knowledge_tags)
    .filter(Boolean);

  return {
    ...raw,
    decision_levels,
    categories,
    domains,
    tags,
  };
};

export const useKnowledgeItems = (params?: {
  search?: string;
  categoryId?: string;
  layerId?: string;  // Deprecated: use decisionLevelId
  decisionLevelId?: string;  // NEW: Filter by decision level
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
          id, name, slug, description, is_published, is_featured, view_count,
          emoji, icon, created_at, updated_at, background,
          learning_value_summary, common_pitfalls,
          category_id, domain_id, planning_focus_id,
          knowledge_item_decision_levels (
            decision_levels (id, name, slug, color, description)
          ),
          knowledge_item_categories (
            knowledge_categories (id, name, slug, color, description)
          ),
          knowledge_item_domains (
            activity_domains (id, name, slug, color, description)
          ),
          knowledge_use_cases (id, case_type, title, summary)
        `);

      // Only filter by published status if not explicitly requesting unpublished items
      if (!params?.showUnpublished) {
        query = query.eq('is_published', true);
      }

      if (params?.search && params.search.length >= 2) {
        const searchTerm = params.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Filter by category via junction table
      if (params?.categoryId) {
        const { data: categoryItems } = await supabase
          .from('knowledge_item_categories')
          .select('knowledge_item_id')
          .eq('category_id', params.categoryId);
        
        if (categoryItems && categoryItems.length > 0) {
          const itemIds = categoryItems.map(c => c.knowledge_item_id);
          query = query.in('id', itemIds);
        } else {
          return [];
        }
      }

      // Filter by decision level via junction table
      const decisionLevelFilter = params?.decisionLevelId || params?.layerId;
      if (decisionLevelFilter) {
        const { data: levelItems } = await supabase
          .from('knowledge_item_decision_levels')
          .select('knowledge_item_id')
          .eq('decision_level_id', decisionLevelFilter);
        
        if (levelItems && levelItems.length > 0) {
          const itemIds = levelItems.map(l => l.knowledge_item_id);
          query = query.in('id', itemIds);
        } else {
          return [];
        }
      }

      // Filter by domain via junction table
      if (params?.domainId) {
        const { data: domainItems } = await supabase
          .from('knowledge_item_domains')
          .select('knowledge_item_id')
          .eq('domain_id', params.domainId);
        
        if (domainItems && domainItems.length > 0) {
          const itemIds = domainItems.map(d => d.knowledge_item_id);
          query = query.in('id', itemIds);
        } else {
          return [];
        }
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
      
      return (data || []).map(transformKnowledgeItem);
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
          id, name, slug, description, is_published, is_featured, view_count,
          emoji, icon, created_at, updated_at, background, source,
          learning_value_summary, common_pitfalls, evidence_sources, related_techniques,
          key_terminology, primary_publication_id,
          category_id, domain_id, planning_focus_id,
          knowledge_item_decision_levels (
            decision_levels (id, name, slug, color, description)
          ),
          knowledge_item_categories (
            knowledge_categories (id, name, slug, color, description)
          ),
          knowledge_item_domains (
            activity_domains (id, name, slug, color, description)
          ),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          ),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return transformKnowledgeItem(data);
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
          id, name, slug, description, is_published, is_featured, view_count,
          emoji, icon, created_at, updated_at, background, source,
          learning_value_summary, common_pitfalls,
          category_id, domain_id, planning_focus_id,
          knowledge_item_decision_levels (
            decision_levels (id, name, slug, color, description)
          ),
          knowledge_item_categories (
            knowledge_categories (id, name, slug, color, description)
          ),
          knowledge_item_domains (
            activity_domains (id, name, slug, color, description)
          ),
          knowledge_use_cases (id, case_type, title, who, what, when_used, where_used, why, how, how_much, summary)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return transformKnowledgeItem(data);
    },
    enabled: !!slug,
  });
};

// Input type for create/update with taxonomy IDs
export interface KnowledgeItemInput {
  name?: string;
  slug?: string;
  description?: string;
  source?: string;
  background?: string;
  author?: string;
  is_published?: boolean;
  is_featured?: boolean;
  icon?: string;
  emoji?: string;
  common_pitfalls?: string[];
  evidence_sources?: string[];
  key_terminology?: Record<string, any>;
  learning_value_summary?: string;
  related_techniques?: string[];
  primary_publication_id?: string;
  
  // Taxonomy IDs for junction tables
  decision_level_ids?: string[];
  category_ids?: string[];
  domain_ids?: string[];
  tag_ids?: string[];
  
  // Legacy single FK fields (still supported for backwards compatibility)
  category_id?: string;
  planning_focus_id?: string;
  domain_id?: string;
}

export const useCreateKnowledgeItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: KnowledgeItemInput) => {
      console.log('🚀 useCreateKnowledgeItem: Starting creation with data:', JSON.stringify(data, null, 2));
      
      // Extract taxonomy IDs
      const { decision_level_ids, category_ids, domain_ids, tag_ids, ...itemData } = data;
      
      // Transform data for knowledge_items table
      const transformedData = {
        ...itemData,
        category_id: itemData.category_id === '' ? null : itemData.category_id,
        planning_focus_id: itemData.planning_focus_id === '' ? null : itemData.planning_focus_id,
        domain_id: itemData.domain_id === '' ? null : itemData.domain_id,
        primary_publication_id: itemData.primary_publication_id === '' || itemData.primary_publication_id === undefined ? null : itemData.primary_publication_id,
      };
      
      // Retry the create operation for network errors
      return retryWithBackoff(async () => {
        // Create the knowledge item
        const { data: result, error } = await supabase
          .from('knowledge_items')
          .insert([transformedData])
          .select()
          .single();

        if (error) {
          console.error('❌ useCreateKnowledgeItem: Insert failed:', error);
          throw error;
        }
        
        const itemId = result.id;
        
        // Insert junction table records for taxonomy
        const junctionInserts = [];
        
        if (decision_level_ids && decision_level_ids.length > 0) {
          junctionInserts.push(
            supabase.from('knowledge_item_decision_levels').insert(
              decision_level_ids.map(id => ({ knowledge_item_id: itemId, decision_level_id: id }))
            )
          );
        }
        
        if (category_ids && category_ids.length > 0) {
          junctionInserts.push(
            supabase.from('knowledge_item_categories').insert(
              category_ids.map(id => ({ knowledge_item_id: itemId, category_id: id }))
            )
          );
        }
        
        if (domain_ids && domain_ids.length > 0) {
          junctionInserts.push(
            supabase.from('knowledge_item_domains').insert(
              domain_ids.map(id => ({ knowledge_item_id: itemId, domain_id: id }))
            )
          );
        }
        
        if (tag_ids && tag_ids.length > 0) {
          junctionInserts.push(
            supabase.from('knowledge_item_tags').insert(
              tag_ids.map(id => ({ knowledge_item_id: itemId, tag_id: id }))
            )
          );
        }
        
        // Execute all junction inserts in parallel
        if (junctionInserts.length > 0) {
          const results = await Promise.all(junctionInserts);
          results.forEach((res, i) => {
            if (res.error) {
              console.error(`❌ Junction insert ${i} failed:`, res.error);
            }
          });
        }
        
        console.log('✅ useCreateKnowledgeItem: Creation successful:', result);
        return result;
      });
    },
    onSuccess: (result) => {
      console.log('🎉 useCreateKnowledgeItem: Success callback:', result);
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      
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
    mutationFn: async ({ id, ...data }: KnowledgeItemInput & { id: string }) => {
      // Extract taxonomy IDs
      const { decision_level_ids, category_ids, domain_ids, tag_ids, ...itemData } = data;
      
      // Transform data to handle empty strings and invalid values
      const transformedData = {
        ...itemData,
        category_id: itemData.category_id === '' ? null : itemData.category_id,
        planning_focus_id: itemData.planning_focus_id === '' ? null : itemData.planning_focus_id,
        domain_id: itemData.domain_id === '' ? null : itemData.domain_id,
        primary_publication_id: itemData.primary_publication_id === '' || itemData.primary_publication_id === undefined ? null : itemData.primary_publication_id,
      };

      console.log('💾 Sending data to Supabase:', transformedData);

      // Retry the update operation for network errors
      return retryWithBackoff(async () => {
        // Update the knowledge item
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
        
        // Update junction tables if taxonomy IDs are provided
        const junctionUpdates = [];
        
        if (decision_level_ids !== undefined) {
          // Delete existing and insert new
          junctionUpdates.push(
            supabase.from('knowledge_item_decision_levels').delete().eq('knowledge_item_id', id).then(() => 
              decision_level_ids.length > 0 
                ? supabase.from('knowledge_item_decision_levels').insert(
                    decision_level_ids.map(dlId => ({ knowledge_item_id: id, decision_level_id: dlId }))
                  )
                : Promise.resolve({ error: null })
            )
          );
        }
        
        if (category_ids !== undefined) {
          junctionUpdates.push(
            supabase.from('knowledge_item_categories').delete().eq('knowledge_item_id', id).then(() =>
              category_ids.length > 0
                ? supabase.from('knowledge_item_categories').insert(
                    category_ids.map(catId => ({ knowledge_item_id: id, category_id: catId }))
                  )
                : Promise.resolve({ error: null })
            )
          );
        }
        
        if (domain_ids !== undefined) {
          junctionUpdates.push(
            supabase.from('knowledge_item_domains').delete().eq('knowledge_item_id', id).then(() =>
              domain_ids.length > 0
                ? supabase.from('knowledge_item_domains').insert(
                    domain_ids.map(domId => ({ knowledge_item_id: id, domain_id: domId }))
                  )
                : Promise.resolve({ error: null })
            )
          );
        }
        
        if (tag_ids !== undefined) {
          junctionUpdates.push(
            supabase.from('knowledge_item_tags').delete().eq('knowledge_item_id', id).then(() =>
              tag_ids.length > 0
                ? supabase.from('knowledge_item_tags').insert(
                    tag_ids.map(tagId => ({ knowledge_item_id: id, tag_id: tagId }))
                  )
                : Promise.resolve({ error: null })
            )
          );
        }
        
        // Execute all junction updates in parallel
        if (junctionUpdates.length > 0) {
          await Promise.all(junctionUpdates);
        }
        
        return result;
      });
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['knowledge-item', id] });
      await queryClient.cancelQueries({ queryKey: ['knowledge-items'] });

      const previousItem = queryClient.getQueryData(['knowledge-item', id]);

      if (previousItem) {
        const optimisticUpdate = { ...(previousItem as KnowledgeItem), ...data, updated_at: new Date().toISOString() };
        queryClient.setQueryData(['knowledge-item', id], optimisticUpdate);
      }

      return { previousItem };
    },
    onSuccess: (result, { id }) => {
      console.log('✅ Update mutation success, updating cache...');
      queryClient.setQueryData(['knowledge-item', id], result);
      const listData = queryClient.getQueryData(['knowledge-items']);
      if (listData && Array.isArray(listData)) {
        const updatedList = listData.map((item: any) => 
          item.id === id ? result : item
        );
        queryClient.setQueryData(['knowledge-items'], updatedList);
      }
      
      // Invalidate to refetch with junction data
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-item-by-id', id] });
      
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
      
      if (context?.previousItem) {
        queryClient.setQueryData(['knowledge-item', id], context.previousItem);
      }
      
      let errorMessage = "Failed to update knowledge item";
      
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
