import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventFeedback, useFeedbackStats } from "@/hooks/useCourseFeedback";
import TestimonialCard from "@/components/feedback/TestimonialCard";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventFeedbackSectionProps {
  eventId: string;
  eventTitle: string;
}

const EventFeedbackSection = ({ eventId, eventTitle }: EventFeedbackSectionProps) => {
  const { data: feedback, isLoading } = useEventFeedback(eventId);
  const { data: stats } = useFeedbackStats(eventTitle);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendee Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!feedback || feedback.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendee Feedback</span>
          {stats && stats.totalRatings > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold">{stats.averageRating}/10</span>
              <span className="text-muted-foreground">({stats.totalRatings} reviews)</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((item) => (
          <TestimonialCard key={item.id} feedback={item} />
        ))}
      </CardContent>
    </Card>
  );
};

export default EventFeedbackSection;
