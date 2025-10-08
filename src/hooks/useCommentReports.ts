import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CommentReport {
  id: string;
  comment_id: string;
  reported_by: string;
  reason: "spam" | "offensive" | "off-topic" | "harassment" | "other";
  details?: string;
  status: "pending" | "reviewed" | "dismissed" | "action_taken";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface ReportCommentParams {
  commentId: string;
  reason: "spam" | "offensive" | "off-topic" | "harassment" | "other";
  details?: string;
}

export function useReportComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: async ({ commentId, reason, details }: ReportCommentParams) => {
      if (!user?.id) {
        throw new Error("You must be logged in to report comments");
      }

      const { error } = await supabase
        .from("comment_reports")
        .insert({
          comment_id: commentId,
          reported_by: user.id,
          reason,
          details,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment-reports"] });
    },
  });

  return {
    reportComment: reportMutation.mutateAsync,
    isReporting: reportMutation.isPending,
  };
}

// Admin hook to fetch all reports
export function useCommentReports(status?: string) {
  return useQuery({
    queryKey: ["comment-reports", status],
    queryFn: async () => {
      let query = supabase
        .from("comment_reports")
        .select(`
          *,
          knowledge_item_comments!inner(
            id,
            content,
            created_at,
            user_id,
            knowledge_item_id
          )
        `)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (CommentReport & {
        knowledge_item_comments: {
          id: string;
          content: string;
          created_at: string;
          user_id: string;
          knowledge_item_id: string;
        };
      })[];
    },
  });
}

// Admin hook to update report status
export function useUpdateReportStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: "reviewed" | "dismissed" | "action_taken";
    }) => {
      if (!user?.id) {
        throw new Error("You must be logged in");
      }

      const { error } = await supabase
        .from("comment_reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment-reports"] });
    },
  });

  return {
    updateStatus: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

// Admin hook to delete a comment
export function useDeleteReportedComment() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const { error } = await supabase
        .from("knowledge_item_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment-reports"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-item-comments"] });
    },
  });

  return {
    deleteComment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
