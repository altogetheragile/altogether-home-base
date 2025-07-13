import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTechniqueComments } from '@/hooks/useTechniqueComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CommentsSectionProps {
  techniqueId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  techniqueId,
}) => {
  const { user } = useAuth();
  const { comments, addComment, voteComment, isAddingComment, isVoting } = useTechniqueComments(techniqueId);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    console.log('🔐 Auth Debug - Attempting to add comment:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      commentContent: newComment.slice(0, 50) + '...'
    });
    
    addComment({ content: newComment });
    setNewComment('');
    toast.success('Comment added successfully');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    
    addComment({ content: replyContent, parentCommentId: parentId });
    setReplyContent('');
    setReplyingTo(null);
    toast.success('Reply added successfully');
  };

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    voteComment({ commentId, voteType });
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const CommentCard = ({ comment, isReply = false }: { comment: any; isReply?: boolean }) => (
    <Card className={`${isReply ? 'ml-8 mt-4' : 'mb-4'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm">
                {getInitials(comment.user_profile?.full_name, comment.user_profile?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {comment.user_profile?.full_name || comment.user_profile?.email || 'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {comment.updated_at !== comment.created_at && (
            <Badge variant="secondary" className="text-xs">Edited</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed mb-4">{comment.content}</p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(comment.id, 'up')}
            disabled={isVoting}
            className="h-8 px-2"
          >
            <ThumbsUp className={`h-3 w-3 mr-1 ${
              comment.user_vote?.vote_type === 'up' ? 'text-green-600 fill-current' : ''
            }`} />
            <span className="text-xs">{comment.upvotes}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(comment.id, 'down')}
            disabled={isVoting}
            className="h-8 px-2"
          >
            <ThumbsDown className={`h-3 w-3 mr-1 ${
              comment.user_vote?.vote_type === 'down' ? 'text-red-600 fill-current' : ''
            }`} />
            <span className="text-xs">{comment.downvotes}</span>
          </Button>

          {!isReply && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-8 px-2"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="mt-4 space-y-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || isAddingComment}
                size="sm"
              >
                <Send className="h-3 w-3 mr-2" />
                Reply
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply: any) => (
              <CommentCard key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Discussion ({comments?.length || 0})
        </h3>
      </div>

      {user ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, experiences, or questions about this technique..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isAddingComment}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Please sign in to join the discussion
              </p>
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {comments?.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        
        {comments?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-medium mb-2">No comments yet</h4>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts about this technique.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};