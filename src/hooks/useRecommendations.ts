import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface Recommendation {
  id: string;
  content_type: 'technique' | 'event' | 'blog' | 'testimonial';
  content_id: string;
  score: number;
  recommendation_type: 'similar' | 'popular' | 'personalized';
  context_data: Record<string, any>;
  content?: any; // Will be populated with actual content
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  /** Plural. The column is `preferred_difficulty_levels`; this was declared singular and so was
   *  never a column at all. */
  preferred_difficulty_levels?: string[];
  preferred_categories?: string[];
  preferred_tags?: string[];
  display_preferences?: Json;
  notification_settings?: Json;
  // Gone: preferred_formats, learning_goals and interaction_score. None is a column on
  // user_preferences and nothing outside this file ever referenced them, so an upsert carrying one
  // would have been rejected whole.
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
    onError: () => { /* silently fail – non-critical */ },
  });
};

export const useRecommendations = (
  contentTypes?: ('technique' | 'event' | 'blog' | 'testimonial')[],
  limit = 6,
  excludeIds: string[] = []
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recommendations', user?.id, contentTypes, limit, excludeIds],
    queryFn: async () => {
      // Always generate fresh recommendations since recommendation_cache table doesn't exist
      return await generateFreshRecommendations(contentTypes, limit, excludeIds, user?.id);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

const generateFreshRecommendations = async (
  contentTypes?: ('technique' | 'event' | 'blog' | 'testimonial')[],
  limit = 6,
  excludeIds: string[] = [],
  _userId?: string
) => {
  // If explicitly empty array, return nothing
  if (contentTypes !== undefined && contentTypes.length === 0) {
    return [];
  }
  // If undefined, use defaults; otherwise use provided types
  const types = contentTypes || ['technique', 'event', 'blog'];

  const techRecs: any[] = [];
  const eventRecs: any[] = [];
  const blogRecs: any[] = [];
  const testimonialRecs: any[] = [];

  // Fetch techniques
  if (types.includes('technique')) {
    let techniqueQuery = supabase
      .from('knowledge_items')
      .select('id, name, slug, description, view_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      techniqueQuery = techniqueQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: techniques } = await techniqueQuery;
    
    techniques?.forEach((technique, index) => {
      techRecs.push({
        content_type: 'technique',
        content_id: technique.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { view_count: technique.view_count },
        content: technique,
      });
    });
  }

  // Fetch events
  if (types.includes('event')) {
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
      eventRecs.push({
        content_type: 'event',
        content_id: event.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { upcoming: true },
        content: event,
      });
    });
  }

  // Fetch blogs
  if (types.includes('blog')) {
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
      blogRecs.push({
        content_type: 'blog',
        content_id: blog.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { recent: true },
        content: blog,
      });
    });
  }

  // Fetch testimonials
  if (types.includes('testimonial')) {
    let testimonialQuery = supabase
      .from('course_feedback')
      .select('*')
      .eq('is_approved', true)
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (excludeIds.length > 0) {
      testimonialQuery = testimonialQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    let { data: testimonials } = await testimonialQuery;

    // Fallback: if no featured testimonials, get highest-rated approved ones
    if (!testimonials || testimonials.length === 0) {
      let fallbackQuery = supabase
        .from('course_feedback')
        .select('*')
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (excludeIds.length > 0) {
        fallbackQuery = fallbackQuery.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: fallbackTestimonials } = await fallbackQuery;
      testimonials = fallbackTestimonials;
    }

    testimonials?.forEach((testimonial, index) => {
      testimonialRecs.push({
        content_type: 'testimonial',
        content_id: testimonial.id,
        score: (limit - index) / limit,
        recommendation_type: 'popular',
        context_data: { rating: testimonial.rating },
        content: testimonial,
      });
    });
  }

  // Interleave arrays in round-robin fashion to mix content types
  const listsInOrder = [techRecs, eventRecs, blogRecs, testimonialRecs].filter(list => list.length > 0);
  const indices = listsInOrder.map(() => 0);
  const final: any[] = [];

  while (final.length < limit && listsInOrder.some((list, idx) => indices[idx] < list.length)) {
    for (let i = 0; i < listsInOrder.length && final.length < limit; i++) {
      const idx = indices[i];
      const list = listsInOrder[i];
      if (idx < list.length) {
        final.push(list[idx]);
        indices[i] = idx + 1;
      }
    }
  }

  // Normalize scores based on final order
  for (let i = 0; i < final.length; i++) {
    final[i].score = (limit - i) / limit;
  }

  return final;
};

export const useTrackInteraction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      contentType,
      contentId: _contentId,
      interactionType,
      value = 1
    }: {
      contentType: 'technique' | 'event' | 'blog' | 'testimonial';
      contentId: string;
      interactionType: 'view' | 'like' | 'bookmark' | 'register' | 'complete';
      value?: number;
    }) => {
      if (!user?.id) return;

      // Interaction scores had no column to live in. `interaction_score` is not on
      // user_preferences, so the select returned an error and the upsert was rejected: this has
      // been called on every recommendation click since it was written and has never recorded
      // anything. `display_preferences` is a real jsonb column, so the score lives under a key
      // inside it, merged rather than replaced so a genuine display preference is not lost.
      //
      // A column of its own would be better. This works today without a migration.
      const { data: currentPrefs } = await supabase
        .from('user_preferences')
        .select('display_preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      const display = (currentPrefs?.display_preferences ?? {}) as Record<string, unknown>;
      const interactionScore = { ...(display.interaction_score as Record<string, number> | undefined) };
      const key = `${contentType}_${interactionType}`;
      interactionScore[key] = (interactionScore[key] || 0) + value;

      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          display_preferences: { ...display, interaction_score: interactionScore },
        });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => { /* silently fail – analytics only */ },
  });
};