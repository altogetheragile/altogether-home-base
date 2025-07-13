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
      // Debug: Check current session before making the request
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 Feedback Debug - Current session:', {
        hasSession: !!sessionData?.session,
        hasAccessToken: !!sessionData?.session?.access_token,
        userEmail: sessionData?.session?.user?.email,
        uid: sessionData?.session?.user?.id
      });

      const insertData: any = {
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

      const { data, error } = await supabase
        .from('kb_feedback')
        .insert(insertData);

      if (error) {
        console.error('❌ Feedback submission error details:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      console.log('✅ Feedback submitted successfully:', data);
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
    enabled: !!techniqueId && techniqueId !== 'undefined' && techniqueId !== 'null',
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
    enabled: !!techniqueId && techniqueId !== 'undefined' && techniqueId !== 'null',
  });
};