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
      const insertData: Record<string, unknown> = {
        technique_id: feedback.technique_id,
      };

      // Only include rating if it's actually set (greater than 0)
      if (feedback.rating && feedback.rating > 0) {
        insertData.rating = feedback.rating;
      }

      // Only include comment if it's provided
      if (feedback.comment && feedback.comment.trim()) {
        insertData.comment = feedback.comment.trim();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- kb_feedback not in generated Supabase types
      const { data, error } = await supabase
        .from('kb_feedback' as any)
        .insert(insertData);

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
    onError: (_error: Error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useTechniqueFeedback = (techniqueId: string) => {
  return useQuery({
    queryKey: ['technique-feedback', techniqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_feedback' as any)
        .select('*')
        .eq('technique_id', techniqueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!techniqueId && techniqueId !== 'undefined' && techniqueId !== 'null' && techniqueId.length > 0,
  });
};

export const useFeedbackStats = (techniqueId: string) => {
  return useQuery({
    queryKey: ['feedback-stats', techniqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_feedback_stats' as any, { p_technique_id: techniqueId });

      if (error) throw error;

      const row = (Array.isArray(data) ? data[0] : data) as { average_rating?: number; total_ratings?: number } | undefined;
      const average = Number(row?.average_rating ?? 0);
      const total = Number(row?.total_ratings ?? 0);

      return { averageRating: Math.round(average * 10) / 10, totalRatings: total };
    },
    enabled: !!techniqueId && techniqueId !== 'undefined' && techniqueId !== 'null' && techniqueId.length > 0,
  });
};