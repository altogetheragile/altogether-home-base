import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, Linkedin } from "lucide-react";
import { CourseFeedback } from "@/hooks/useCourseFeedback";
import { format } from "date-fns";
import { useState } from "react";

interface TestimonialCardProps {
  feedback: CourseFeedback;
  showName?: boolean;
  showCompany?: boolean;
  showRating?: boolean;
}

const TestimonialCard = ({ 
  feedback,
  showName = true,
  showCompany = true,
  showRating = true
}: TestimonialCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const truncateLength = 200;
  const needsTruncation = feedback.comment.length > truncateLength;

  const displayComment = expanded || !needsTruncation
    ? feedback.comment
    : feedback.comment.slice(0, truncateLength) + "...";

  const renderStars = () => {
    const fullStars = Math.floor(feedback.rating / 2);
    const hasHalfStar = feedback.rating % 2 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        )}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-muted-foreground" />
        ))}
        <span className="ml-2 font-semibold text-sm">{feedback.rating}/10</span>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {(showName || showCompany) && (
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              {showName && (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {feedback.first_name} {feedback.last_name}
                  </h3>
                  {feedback.source === 'linkedin' && (
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              )}
              {showCompany && feedback.job_title && feedback.company && (
                <p className="text-sm text-muted-foreground">
                  {feedback.job_title} at {feedback.company}
                </p>
              )}
              {showCompany && feedback.company && !feedback.job_title && (
                <p className="text-sm text-muted-foreground">{feedback.company}</p>
              )}
            </div>
            {feedback.is_featured && (
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                Featured
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-2">
          {showRating && feedback.rating && feedback.rating > 0 && renderStars()}
          <Badge variant="secondary">{feedback.course_name}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{displayComment}</p>
          {needsTruncation && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {format(new Date(feedback.submitted_at), 'MMM dd, yyyy')}
          </p>
          {feedback.source_url && (
            <a
              href={feedback.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View original <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
