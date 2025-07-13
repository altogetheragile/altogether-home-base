import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeedbackData {
  technique_id: string;
  rating?: number;
  comment?: string;
}

export const useSubmitFeedback = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: FeedbackData) => {
      const { data, error } = await supabase
        .from('kb_feedback')
        .insert({
          technique_id: feedback.technique_id,
          rating: feedback.rating,
          comment: feedback.comment,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ['technique-feedback'] });
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

export const useTechniqueFeedback = (techniqueId: string) => {
  return useQuery({
    queryKey: ['technique-feedback', techniqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_feedback')
        .select('*')
        .eq('technique_id', techniqueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useFeedbackStats = (techniqueId: string) => {
  return useQuery({
    queryKey: ['feedback-stats', techniqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_feedback')
        .select('rating')
        .eq('technique_id', techniqueId)
        .not('rating', 'is', null);

      if (error) throw error;

      if (!data.length) {
        return { averageRating: 0, totalRatings: 0 };
      }

      const totalRatings = data.length;
      const averageRating = data.reduce((sum, item) => sum + (item.rating || 0), 0) / totalRatings;

      return { averageRating: Math.round(averageRating * 10) / 10, totalRatings };
    },
  });
};