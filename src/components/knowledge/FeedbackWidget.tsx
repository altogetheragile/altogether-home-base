import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFeedback } from '@/hooks/useFeedback';

interface FeedbackWidgetProps {
  techniqueId: string;
}

export const FeedbackWidget = ({ techniqueId }: FeedbackWidgetProps) => {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedRating, setSelectedRating] = useState<-1 | 0 | 1 | null>(null);
  
  const { feedbackStats, submitFeedback, isSubmitting } = useFeedback(techniqueId);

  const handleRating = (rating: -1 | 0 | 1) => {
    setSelectedRating(rating);
    if (rating !== 0) {
      // For thumbs up/down, show comment option
      setShowComment(true);
    } else {
      // For neutral, submit immediately
      submitFeedback({ technique_id: techniqueId, rating });
      setSelectedRating(null);
    }
  };

  const handleSubmitWithComment = () => {
    if (selectedRating !== null) {
      submitFeedback({
        technique_id: techniqueId,
        rating: selectedRating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      setShowComment(false);
      setSelectedRating(null);
    }
  };

  const handleCancel = () => {
    setShowComment(false);
    setSelectedRating(null);
    setComment('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Was this helpful?
        </CardTitle>
        {feedbackStats && feedbackStats.total > 0 && (
          <CardDescription>
            {feedbackStats.positive} of {feedbackStats.total} people found this helpful
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!showComment ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRating(1)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Yes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRating(-1)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              No
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {selectedRating === 1 ? 'Great! ' : 'Thanks for the feedback. '}
              Care to tell us more? (optional)
            </div>
            <Textarea
              placeholder="Your feedback helps us improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmitWithComment}
                disabled={isSubmitting}
              >
                Submit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};