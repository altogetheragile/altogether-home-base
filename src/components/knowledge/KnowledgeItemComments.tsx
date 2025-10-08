import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useKnowledgeItemComments } from "@/hooks/useKnowledgeItemComments";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageCircle, Send, Loader2, Pencil, Trash2, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ReportCommentButton } from "./ReportCommentButton";

interface KnowledgeItemCommentsProps {
  knowledgeItemId: string;
}

export const KnowledgeItemComments = ({ knowledgeItemId }: KnowledgeItemCommentsProps) => {
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';
  
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  const { 
    comments, 
    isLoading, 
    error, 
    addComment, 
    updateComment, 
    deleteComment,
    isAddingComment,
    isUpdatingComment,
    isDeletingComment
  } = useKnowledgeItemComments(knowledgeItemId);

  const MIN_LENGTH = 3;
  const MAX_LENGTH = 2000;
  const charCount = newComment.length;
  const isValidLength = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  // Phase 1: Quality checks
  const checkCommentQuality = (content: string): { valid: boolean; error?: string } => {
    const trimmed = content.trim();
    
    // Check length
    if (trimmed.length < MIN_LENGTH) {
      return { valid: false, error: `Comment must be at least ${MIN_LENGTH} characters` };
    }
    if (trimmed.length > MAX_LENGTH) {
      return { valid: false, error: `Comment must be less than ${MAX_LENGTH} characters` };
    }

    // Check for all-caps (>80% uppercase)
    const uppercaseCount = (trimmed.match(/[A-Z]/g) || []).length;
    const letterCount = (trimmed.match(/[A-Za-z]/g) || []).length;
    if (letterCount > 10 && uppercaseCount / letterCount > 0.8) {
      return { valid: false, error: "Please don't use all caps" };
    }

    // Check for excessive repetition (same character 10+ times)
    if (/(.)\1{9,}/.test(trimmed)) {
      return { valid: false, error: "Please avoid excessive repetition" };
    }

    return { valid: true };
  };

  const handleSubmitComment = async () => {
    const qualityCheck = checkCommentQuality(newComment);
    
    if (!qualityCheck.valid) {
      toast.error(qualityCheck.error);
      return;
    }

    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    try {
      await addComment({ content: newComment.trim() });
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Phase 2: Better error messages for database constraints
      if (errorMessage.includes("posting too quickly")) {
        toast.error("Slow down! Please wait 30 seconds between comments");
      } else if (errorMessage.includes("already posted this comment")) {
        toast.error("You've already posted this comment");
      } else {
        toast.error("Failed to add comment");
      }
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async (commentId: string) => {
    const qualityCheck = checkCommentQuality(editContent);
    
    if (!qualityCheck.valid) {
      toast.error(qualityCheck.error);
      return;
    }

    try {
      await updateComment({ commentId, content: editContent.trim() });
      setEditingCommentId(null);
      toast.success("Comment updated successfully");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(commentToDelete);
      toast.success(isAdmin ? "Comment removed by admin" : "Comment deleted successfully");
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    } catch (error) {
      toast.error("Failed to delete comment. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-8 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <p className="text-destructive font-medium mb-2">Failed to load comments</p>
          <p className="text-sm text-muted-foreground">
            {error.message || "Please try refreshing the page"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a Comment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Share your thoughts, questions, or experiences..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={MAX_LENGTH}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Minimum {MIN_LENGTH} characters</span>
                <span className={charCount > MAX_LENGTH ? "text-destructive" : ""}>
                  {charCount} / {MAX_LENGTH}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isAddingComment || !isValidLength}
              >
                {isAddingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Sign in to join the conversation
            </p>
            <Button variant="outline" asChild>
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {comment.user_profile?.username?.[0]?.toUpperCase() || 
                       comment.user_profile?.full_name?.[0]?.toUpperCase() || 
                       comment.user_profile?.email?.[0]?.toUpperCase() || 
                       "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user_profile?.username || comment.user_profile?.full_name || comment.user_profile?.email || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-muted-foreground italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {/* Comment Content or Edit Mode */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          maxLength={MAX_LENGTH}
                          className="resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {editContent.length} / {MAX_LENGTH}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isUpdatingComment}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={isUpdatingComment || editContent.length < MIN_LENGTH || editContent.length > MAX_LENGTH}
                            >
                              {isUpdatingComment ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Owner Controls */}
                      {user && user.id === comment.user_id && editingCommentId !== comment.id && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditComment(comment.id, comment.content)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}

                      {/* Admin Controls */}
                      {isAdmin && user && user.id !== comment.user_id && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </>
                      )}

                      {/* Report Button for other users */}
                      {user && user.id !== comment.user_id && !isAdmin && (
                        <ReportCommentButton commentId={comment.id} />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-muted/20">
            <CardContent className="py-12 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No comments yet. Be the first to share your thoughts!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingComment ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
