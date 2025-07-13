import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackData {
  technique_id: string;
  rating: -1 | 0 | 1;
  comment?: string;
}

interface FeedbackStats {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  average: number;
}

export const useFeedback = (techniqueId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get feedback stats for a technique
  const { data: feedbackStats, isLoading } = useQuery({
    queryKey: ['feedback-stats', techniqueId],
    queryFn: async (): Promise<FeedbackStats> => {
      const { data, error } = await supabase
        .from('kb_feedback')
        .select('rating')
        .eq('technique_id', techniqueId);

      if (error) throw error;

      const positive = data.filter(f => f.rating === 1).length;
      const negative = data.filter(f => f.rating === -1).length;
      const neutral = data.filter(f => f.rating === 0).length;
      const total = data.length;
      const average = total > 0 ? data.reduce((sum, f) => sum + f.rating, 0) / total : 0;

      return { positive, negative, neutral, total, average };
    },
    enabled: !!techniqueId,
  });

  // Submit feedback
  const submitFeedback = useMutation({
    mutationFn: async (feedbackData: FeedbackData) => {
      // Get user's IP (simplified - in production you'd handle this server-side)
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { data, error } = await supabase
        .from('kb_feedback')
        .insert({
          ...feedbackData,
          ip_address: ip,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-stats', techniqueId] });
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve our content.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error('Feedback submission error:', error);
    },
  });

  return {
    feedbackStats,
    isLoading,
    submitFeedback: submitFeedback.mutate,
    isSubmitting: submitFeedback.isPending,
  };
};