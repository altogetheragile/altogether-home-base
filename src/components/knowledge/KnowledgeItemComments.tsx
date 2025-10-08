import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useKnowledgeItemComments } from "@/hooks/useKnowledgeItemComments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ReportCommentButton } from "./ReportCommentButton";

interface KnowledgeItemCommentsProps {
  knowledgeItemId: string;
}

export const KnowledgeItemComments = ({ knowledgeItemId }: KnowledgeItemCommentsProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const { comments, isLoading, error, addComment, isAddingComment } = useKnowledgeItemComments(knowledgeItemId);

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
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {user && user.id !== comment.user_id && (
                      <div className="mt-2">
                        <ReportCommentButton commentId={comment.id} />
                      </div>
                    )}
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
    </div>
  );
};
