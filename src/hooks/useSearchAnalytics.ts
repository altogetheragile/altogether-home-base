import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchAnalytics {
  id: string;
  query: string;
  results_count: number;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  clicked_technique_id?: string;
  search_filters: Record<string, any>;
  created_at: string;
}

interface LogSearchParams {
  query: string;
  results_count: number;
  clicked_technique_id?: string;
  search_filters?: Record<string, any>;
}

export const useLogSearch = () => {
  return useMutation({
    mutationFn: async (params: LogSearchParams) => {
      const { data, error } = await supabase
        .from('search_analytics')
        .insert({
          query: params.query,
          results_count: params.results_count,
          clicked_technique_id: params.clicked_technique_id,
          search_filters: params.search_filters || {},
        });

      if (error) throw error;
      return data;
    },
  });
};

export const useSearchSuggestions = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: ['search-suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      // Get technique suggestions
      const { data: techniques } = await supabase
        .from('knowledge_techniques')
        .select('name, slug')
        .eq('is_published', true)
        .ilike('name', `${searchTerm}%`)
        .order('popularity_score', { ascending: false })
        .limit(3);

      // Get category suggestions
      const { data: categories } = await supabase
        .from('knowledge_categories')
        .select('name, slug')
        .ilike('name', `${searchTerm}%`)
        .limit(2);

      // Get tag suggestions
      const { data: tags } = await supabase
        .from('knowledge_tags')
        .select('name, slug, usage_count')
        .ilike('name', `${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(3);

      const suggestions = [
        ...(techniques || []).map(t => ({ ...t, type: 'technique' as const })),
        ...(categories || []).map(c => ({ ...c, type: 'category' as const })),
        ...(tags || []).map(t => ({ ...t, type: 'tag' as const })),
      ];

      return suggestions;
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_popular_searches', { p_limit: 5, p_days: 30 });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        query: row.query,
        count: Number(row.search_count) || 0,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchAnalytics = () => {
  return useQuery({
    queryKey: ['search-analytics-overview'],
    queryFn: async () => {
      const { data: analytics, error } = await supabase
        .from('search_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalSearches = analytics.length;
      const uniqueQueries = new Set(analytics.map(a => a.query)).size;
      const successfulSearches = analytics.filter(a => a.results_count > 0).length;
      const successRate = totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;

      return {
        totalSearches,
        uniqueQueries,
        successRate,
        averageResults: totalSearches > 0 ? analytics.reduce((sum, a) => sum + a.results_count, 0) / totalSearches : 0,
      };
    },
  });
};