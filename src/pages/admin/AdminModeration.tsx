import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCommentReports, useUpdateReportStatus, useDeleteReportedComment } from "@/hooks/useCommentReports";
import { Flag, Trash2, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function AdminModeration() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  
  const { data: reports, isLoading } = useCommentReports(statusFilter);
  const { updateStatus, isUpdating } = useUpdateReportStatus();
  const { deleteComment, isDeleting } = useDeleteReportedComment();

  const handleUpdateStatus = async (reportId: string, status: "reviewed" | "dismissed" | "action_taken") => {
    try {
      await updateStatus({ reportId, status });
      toast({
        title: "Report updated",
        description: `Report marked as ${status.replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Failed to update report",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentId) return;

    try {
      await deleteComment({ commentId: selectedCommentId });
      toast({
        title: "Comment deleted",
        description: "The comment has been removed",
      });
      setDeleteDialogOpen(false);
      setSelectedCommentId(null);
    } catch (error) {
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getReasonBadgeVariant = (reason: string) => {
    switch (reason) {
      case "spam":
        return "secondary";
      case "offensive":
        return "destructive";
      case "harassment":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "reviewed":
        return "secondary";
      case "action_taken":
        return "default";
      case "dismissed":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Comment Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage reported comments to maintain community standards
        </p>
      </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="action_taken">Action Taken</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4 mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : !reports || reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reports found</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getReasonBadgeVariant(report.reason)}>
                            {report.reason}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(report.status)}>
                            {report.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <CardDescription>
                          Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(report.id, "dismissed")}
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(report.id, "reviewed")}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Reviewed
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCommentId(report.comment_id);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Comment
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Reported Comment:</p>
                      <p className="text-sm whitespace-pre-wrap">{report.knowledge_item_comments.content}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Posted {formatDistanceToNow(new Date(report.knowledge_item_comments.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {report.details && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                              Additional Details:
                            </p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{report.details}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Link
                        to={`/knowledge/${report.knowledge_item_comments.knowledge_item_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View in context →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment and automatically update the report status to "action taken". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
