import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeItem {
  id: string;
  name: string;
  slug: string;
  purpose?: string;
  description?: string;
  originator?: string;
  category_id?: string;
  activity_focus_id?: string;
  activity_domain_id?: string;
  activity_category_id?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_published: boolean;
  is_featured: boolean;
  is_complete: boolean;
  view_count: number;
  popularity_score: number;
  difficulty_level?: string;
  estimated_reading_time?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Rich data fields from Excel
  generic_who?: string;
  generic_what?: string;
  generic_when?: string;
  generic_where?: string;
  generic_why?: string;
  generic_how?: string;
  generic_how_much?: string;
  generic_summary?: string;
  example_use_case?: string;
  example_who?: string;
  example_what?: string;
  example_when?: string;
  example_where?: string;
  example_why?: string;
  example_how?: string;
  example_how_much?: string;
  example_summary?: string;
  source?: string;
  background?: string;
  planning_considerations?: string;
  typical_participants?: string[];
  required_skills?: string[];
  success_criteria?: string[];
  common_pitfalls?: string[];
  related_practices?: string[];
  industry_context?: string;
  team_size_min?: number;
  team_size_max?: number;
  duration_min_minutes?: number;
  duration_max_minutes?: number;
  
  // Relations
  knowledge_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  activity_focus?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  activity_domains?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  activity_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  knowledge_item_planning_layers?: Array<{
    is_primary: boolean;
    planning_layers: {
      id: string;
      name: string;
      slug: string;
      color: string;
      display_order: number;
    };
  }>;
  planning_layers?: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
    display_order: number;
    is_primary: boolean;
  }>;
  knowledge_item_tags?: Array<{
    knowledge_tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  knowledge_tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  knowledge_media?: Array<{
    id: string;
    type: string;
    title?: string;
    url: string;
    thumbnail_url?: string;
  }>;
  knowledge_examples?: Array<{
    id: string;
    title: string;
    description: string;
    context?: string;
  }>;
}

export const useKnowledgeItems = (params?: {
  search?: string;
  categoryId?: string;
  focusId?: string;
  domainId?: string;
  activityCategoryId?: string;
  planningLayerId?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: ['knowledge-items', params],
    queryFn: async () => {
      console.log('🔍 Knowledge items search params:', params);
      
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          activity_focus (id, name, slug, color),
          activity_domains (id, name, slug, color),
          activity_categories (id, name, slug, color),
          knowledge_item_planning_layers (
            is_primary,
            planning_layers (id, name, slug, color, display_order)
          ),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          ),
          knowledge_media (id, type, title, url, thumbnail_url),
          knowledge_examples (id, title, description, context)
        `)
        .eq('is_published', true);
      
      console.log('🔍 Base query created');

      // Enhanced search with full-text search
      if (params?.search && params.search.length >= 2) {
        const searchTerm = params.search.trim();
        console.log('🔍 Search term after trim:', searchTerm);
        if (searchTerm) {
          const searchFilter = `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,purpose.ilike.%${searchTerm}%`;
          console.log('🔍 Applying search filter:', searchFilter);
          query = query.or(searchFilter);
        }
      }

      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
      }

      if (params?.focusId) {
        query = query.eq('activity_focus_id', params.focusId);
      }

      if (params?.domainId) {
        query = query.eq('activity_domain_id', params.domainId);
      }

      if (params?.activityCategoryId) {
        query = query.eq('activity_category_id', params.activityCategoryId);
      }

      if (params?.featured) {
        query = query.eq('is_featured', true);
      }

      // Apply sorting
      switch (params?.sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        case 'difficulty':
          query = query.order('difficulty_level', { ascending: true, nullsFirst: true });
          break;
        case 'popularity':
        default:
          query = query.order('popularity_score', { ascending: false })
                      .order('view_count', { ascending: false });
          break;
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      console.log('🔍 Executing query...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }

      console.log('✅ Query successful, results count:', data?.length || 0);
      console.log('📋 Raw data sample:', data?.slice(0, 2));

      // Transform the data to flatten structures
      const transformedData = data.map(item => ({
        ...item,
        knowledge_tags: item.knowledge_item_tags?.map(tt => tt.knowledge_tags).filter(Boolean) || [],
        planning_layers: item.knowledge_item_planning_layers?.map(pl => ({
          ...pl.planning_layers,
          is_primary: pl.is_primary
        })).filter(Boolean).sort((a, b) => a.display_order - b.display_order) || []
      }));

      console.log('🔄 Transformed data sample:', transformedData?.slice(0, 2));

      // Additional client-side filtering for tags and planning layers
      let filteredData = transformedData;

      if (params?.tag) {
        filteredData = filteredData.filter(item => 
          item.knowledge_tags?.some(tag => tag.slug === params.tag)
        );
      }

      if (params?.planningLayerId) {
        filteredData = filteredData.filter(item => 
          item.planning_layers?.some(layer => layer.id === params.planningLayerId)
        );
      }

      return filteredData;
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
          activity_focus (id, name, slug, color),
          activity_domains (id, name, slug, color),
          activity_categories (id, name, slug, color),
          knowledge_item_planning_layers (
            is_primary,
            planning_layers (id, name, slug, color, display_order)
          ),
          knowledge_item_tags (
            knowledge_tags (id, name, slug)
          ),
          knowledge_media (id, type, title, description, url, thumbnail_url, position),
          knowledge_examples (id, title, description, context, industry, company_size, outcome, position)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Transform and sort the data
      return {
        ...data,
        knowledge_tags: data.knowledge_item_tags?.map(tt => tt.knowledge_tags).filter(Boolean) || [],
        planning_layers: data.knowledge_item_planning_layers?.map(pl => ({
          ...pl.planning_layers,
          is_primary: pl.is_primary
        })).filter(Boolean).sort((a, b) => a.display_order - b.display_order) || [],
        knowledge_media: data.knowledge_media?.sort((a, b) => a.position - b.position) || [],
        knowledge_examples: data.knowledge_examples?.sort((a, b) => a.position - b.position) || []
      };
    },
    enabled: !!slug,
  });
};