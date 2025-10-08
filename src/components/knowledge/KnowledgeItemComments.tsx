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

interface KnowledgeItemCommentsProps {
  knowledgeItemId: string;
}

export const KnowledgeItemComments = ({ knowledgeItemId }: KnowledgeItemCommentsProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const { comments, isLoading, error, addComment, isAddingComment } = useKnowledgeItemComments(knowledgeItemId);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    try {
      await addComment({ content: newComment });
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
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
            <Textarea
              placeholder="Share your thoughts, questions, or experiences..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isAddingComment || !newComment.trim()}
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
