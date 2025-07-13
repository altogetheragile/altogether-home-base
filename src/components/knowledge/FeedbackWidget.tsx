import { useState } from "react";
import { Star, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmitFeedback, useFeedbackStats } from "@/hooks/useFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface FeedbackWidgetProps {
  techniqueId: string;
}

export const FeedbackWidget = ({ techniqueId }: FeedbackWidgetProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { user } = useAuth();
  const submitFeedback = useSubmitFeedback();
  const { data: stats } = useFeedbackStats(techniqueId);

  const handleSubmit = () => {
    // Require either a rating (> 0) OR a comment
    if (rating === 0 && !comment.trim()) return;

    console.log('🔐 Auth Debug - Attempting to submit feedback:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      rating,
      hasComment: !!comment.trim()
    });

    submitFeedback.mutate({
      technique_id: techniqueId,
      rating: rating || undefined,
      comment: comment.trim() || undefined,
    }, {
      onSuccess: () => {
        console.log('✅ Feedback submitted successfully');
        setRating(0);
        setComment("");
        setShowForm(false);
      },
      onError: (error) => {
        console.error('❌ Feedback submission failed:', error);
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Feedback</span>
          {stats && stats.totalRatings > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span>{stats.averageRating} ({stats.totalRatings} ratings)</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <div className="text-center space-y-3 py-4">
            <LogIn className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Please sign in to leave feedback
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        ) : !showForm ? (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
            Leave Feedback
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rate this content</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="text-sm font-medium mb-2 block">
                Additional comments (optional)
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this content..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={(rating === 0 && !comment.trim()) || submitFeedback.isPending}
                className="flex-1"
              >
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setComment("");
                }}
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