import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CourseFeedback {
  id: string;
  event_id?: string;
  course_name: string;
  first_name: string;
  last_name: string;
  rating: number;
  comment: string;
  company?: string;
  job_title?: string;
  source: string;
  source_url?: string;
  submitted_at: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedbackFilters {
  isApproved?: boolean;
  isFeatured?: boolean;
  courseType?: string;
  minRating?: number;
  source?: string;
}

export const useCourseFeedback = (filters?: FeedbackFilters) => {
  return useQuery({
    queryKey: ['course-feedback', filters],
    queryFn: async () => {
      let query = supabase
        .from('course_feedback')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filters?.isApproved !== undefined) {
        query = query.eq('is_approved', filters.isApproved);
      }
      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }
      if (filters?.courseType) {
        query = query.ilike('course_name', `%${filters.courseType}%`);
      }
      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CourseFeedback[];
    },
  });
};

export const useEventFeedback = (eventId: string) => {
  return useQuery({
    queryKey: ['event-feedback', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_feedback')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_approved', true)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as CourseFeedback[];
    },
    enabled: !!eventId,
  });
};

export const useFeaturedFeedback = (limit: number = 6) => {
  return useQuery({
    queryKey: ['featured-feedback', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_feedback')
        .select('*')
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CourseFeedback[];
    },
  });
};

export const useFeedbackStats = (courseType?: string) => {
  return useQuery({
    queryKey: ['feedback-stats', courseType],
    queryFn: async () => {
      let query = supabase
        .from('course_feedback')
        .select('rating')
        .eq('is_approved', true);

      if (courseType) {
        query = query.ilike('course_name', `%${courseType}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const ratings = data.map(f => f.rating);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
      };
    },
  });
};

export const useSubmitFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: Partial<CourseFeedback>) => {
      const { data, error } = await supabase
        .from('course_feedback')
        .insert({
          ...feedback,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! It will be reviewed shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['course-feedback'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      console.error('Feedback submission error:', error);
    },
  });
};

export const useUpdateFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CourseFeedback> }) => {
      const { data, error } = await supabase
        .from('course_feedback')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Feedback updated",
        description: "Feedback has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['course-feedback'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update feedback. Please try again.",
        variant: "destructive",
      });
      console.error('Feedback update error:', error);
    },
  });
};

export const useDeleteFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Feedback deleted",
        description: "Feedback has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['course-feedback'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
      console.error('Feedback delete error:', error);
    },
  });
};

export const useBulkApproveFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('course_feedback')
        .update({ 
          is_approved: true,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast({
        title: "Feedback approved",
        description: `${ids.length} feedback entries approved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['course-feedback'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve feedback. Please try again.",
        variant: "destructive",
      });
      console.error('Bulk approve error:', error);
    },
  });
};
