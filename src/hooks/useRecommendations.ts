import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Recommendation {
  id: string;
  content_type: 'technique' | 'event' | 'blog';
  content_id: string;
  score: number;
  recommendation_type: 'similar' | 'popular' | 'personalized';
  context_data: Record<string, any>;
  content?: any; // Will be populated with actual content
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_difficulty_level?: string;
  preferred_categories?: string[];
  preferred_formats?: string[];
  learning_goals?: string[];
  interaction_score?: Record<string, any>;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useRecommendations = (
  contentType?: 'technique' | 'event' | 'blog',
  limit = 6,
  excludeIds: string[] = []
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recommendations', user?.id, contentType, limit, excludeIds],
    queryFn: async () => {
      // First try to get cached recommendations
      const { data: cached } = await supabase
        .from('recommendation_cache')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .eq('content_type', contentType || 'technique')
        .eq('user_id', user?.id || null)
        .not('content_id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '()')
        .order('score', { ascending: false })
        .limit(limit);

      if (cached && cached.length >= limit) {
        // Fetch actual content for each cached recommendation
        const enrichedRecommendations = await Promise.all(
          cached.map(async (item: any) => {
            let content = null;
            
            if (item.content_type === 'technique') {
              const { data } = await supabase
                .from('knowledge_techniques')
                .select('id, name, slug, description, difficulty_level, image_url, view_count')
                .eq('id', item.content_id)
                .eq('is_published', true)
                .single();
              content = data;
            } else if (item.content_type === 'event') {
              const { data } = await supabase
                .from('events')
                .select('id, title, description, start_date, end_date, price_cents')
                .eq('id', item.content_id)
                .eq('is_published', true)
                .single();
              content = data;
            } else if (item.content_type === 'blog') {
              const { data } = await supabase
                .from('blog_posts')
                .select('id, title, excerpt, slug, featured_image_url')
                .eq('id', item.content_id)
                .eq('is_published', true)
                .single();
              content = data;
            }
            
            return { ...item, content };
          })
        );
        
        return enrichedRecommendations.filter(item => item.content);
      }

      // Fall back to generating fresh recommendations
      return await generateFreshRecommendations(contentType, limit, excludeIds, user?.id);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

const generateFreshRecommendations = async (
  contentType?: string,
  limit = 6,
  excludeIds: string[] = [],
  userId?: string
) => {
  const recommendations: any[] = [];

  if (!contentType || contentType === 'technique') {
    // Get popular techniques
    let techniqueQuery = supabase
      .from('knowledge_techniques')
      .select('id, name, slug, description, difficulty_level, image_url, view_count, popularity_score')
      .eq('is_published', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      techniqueQuery = techniqueQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: techniques } = await techniqueQuery;
    
    techniques?.forEach((technique, index) => {
      recommendations.push({
        content_type: 'technique',
        content_id: technique.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { popularity_score: technique.popularity_score },
        content: technique,
      });
    });
  }

  if (!contentType || contentType === 'event') {
    // Get upcoming events
    let eventQuery = supabase
      .from('events')
      .select('id, title, description, start_date, end_date, price_cents, capacity')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(limit);

    if (excludeIds.length > 0) {
      eventQuery = eventQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: events } = await eventQuery;
    
    events?.forEach((event, index) => {
      recommendations.push({
        content_type: 'event',
        content_id: event.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { upcoming: true },
        content: event,
      });
    });
  }

  if (!contentType || contentType === 'blog') {
    // Get recent blog posts
    let blogQuery = supabase
      .from('blog_posts')
      .select('id, title, excerpt, slug, featured_image_url, published_at, view_count')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      blogQuery = blogQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: blogs } = await blogQuery;
    
    blogs?.forEach((blog, index) => {
      recommendations.push({
        content_type: 'blog',
        content_id: blog.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { recent: true },
        content: blog,
      });
    });
  }

  return recommendations.slice(0, limit);
};

export const useTrackInteraction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      interactionType,
      value = 1
    }: {
      contentType: 'technique' | 'event' | 'blog';
      contentId: string;
      interactionType: 'view' | 'like' | 'bookmark' | 'register' | 'complete';
      value?: number;
    }) => {
      if (!user?.id) return;

      // Update user preferences based on interaction
      const { data: currentPrefs } = await supabase
        .from('user_preferences')
        .select('interaction_score')
        .eq('user_id', user.id)
        .maybeSingle();

      const interactionScore = currentPrefs?.interaction_score || {};
      const key = `${contentType}_${interactionType}`;
      interactionScore[key] = (interactionScore[key] || 0) + value;

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          interaction_score: interactionScore,
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};