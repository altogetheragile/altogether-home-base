import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeTechnique {
  id: string;
  name: string;
  slug: string;
  purpose?: string;
  description?: string;
  originator?: string;
  category_id?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_published: boolean;
  is_featured: boolean;
  is_complete: boolean;
  view_count: number;
  popularity_score: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  knowledge_categories?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
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

export const useKnowledgeTechniques = (params?: {
  search?: string;
  categoryId?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: ['knowledge-techniques', params],
    queryFn: async () => {
      console.log('🔍 Knowledge techniques search params:', params);
      
      let query = supabase
        .from('knowledge_techniques')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          knowledge_technique_tags (
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
          const searchFilter = `
            name.ilike.%${searchTerm}%,
            description.ilike.%${searchTerm}%,
            summary.ilike.%${searchTerm}%,
            purpose.ilike.%${searchTerm}%
          `;
          console.log('🔍 Applying search filter:', searchFilter);
          query = query.or(searchFilter);
        }
      }

      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId);
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

      // Transform the data to flatten the tags structure
      const transformedData = data.map(technique => ({
        ...technique,
        knowledge_tags: technique.knowledge_technique_tags?.map(tt => tt.knowledge_tags).filter(Boolean) || []
      }));

      console.log('🔄 Transformed data sample:', transformedData?.slice(0, 2));

      // Additional client-side filtering for tags if needed
      if (params?.tag) {
        return transformedData.filter(technique => 
          technique.knowledge_tags?.some(tag => tag.slug === params.tag)
        );
      }

      return transformedData;
    },
  });
};

export const useKnowledgeTechniqueBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['knowledge-technique', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_techniques')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          knowledge_technique_tags (
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
        knowledge_tags: data.knowledge_technique_tags?.map(tt => tt.knowledge_tags).filter(Boolean) || [],
        knowledge_media: data.knowledge_media?.sort((a, b) => a.position - b.position) || [],
        knowledge_examples: data.knowledge_examples?.sort((a, b) => a.position - b.position) || []
      };
    },
    enabled: !!slug,
  });
};