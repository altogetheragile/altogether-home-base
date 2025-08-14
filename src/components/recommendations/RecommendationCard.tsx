import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, BookOpen, Star, Zap, TrendingUp } from 'lucide-react';
import { Recommendation } from '@/hooks/useRecommendations';
import { format } from 'date-fns';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onView: (id: string) => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onView,
  className = '',
}) => {
  const { content_type, content, recommendation_type, score } = recommendation;

  const getRecommendationIcon = () => {
    switch (recommendation_type) {
      case 'personalized':
        return <Star className="h-4 w-4 text-primary" />;
      case 'similar':
        return <Zap className="h-4 w-4 text-secondary" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRecommendationLabel = () => {
    switch (recommendation_type) {
      case 'personalized':
        return 'For You';
      case 'similar':
        return 'Similar';
      case 'popular':
        return 'Popular';
      default:
        return 'Recommended';
    }
  };

  const renderTechniqueCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {content?.name}
          </CardTitle>
          <div className="flex items-center gap-1 ml-2">
            {getRecommendationIcon()}
            <Badge variant="outline" className="text-xs">
              {getRecommendationLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {content?.image_url && (
          <img
            src={content.image_url}
            alt={content.name}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {content?.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {content?.difficulty_level && (
              <Badge variant="secondary" className="text-xs">
                {content.difficulty_level}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {content?.view_count || 0}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(content?.slug || content?.id)}
            className="shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Learn
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderEventCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {content?.title}
          </CardTitle>
          <div className="flex items-center gap-1 ml-2">
            {getRecommendationIcon()}
            <Badge variant="outline" className="text-xs">
              {getRecommendationLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {content?.description}
        </p>
        <div className="space-y-2 mb-4">
          {content?.start_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {format(new Date(content.start_date), 'MMM dd, yyyy')}
                {content?.end_date && content.end_date !== content.start_date && 
                  ` - ${format(new Date(content.end_date), 'MMM dd, yyyy')}`
                }
              </span>
            </div>
          )}
          {content?.price_cents && (
            <div className="text-sm font-semibold">
              ${(content.price_cents / 100).toFixed(2)}
            </div>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onView(content?.id)}
          className="w-full"
        >
          View Event
        </Button>
      </CardContent>
    </Card>
  );

  const renderBlogCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {content?.title}
          </CardTitle>
          <div className="flex items-center gap-1 ml-2">
            {getRecommendationIcon()}
            <Badge variant="outline" className="text-xs">
              {getRecommendationLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {content?.featured_image_url && (
          <img
            src={content.featured_image_url}
            alt={content.title}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {content?.excerpt}
        </p>
        <Button
          size="sm"
          onClick={() => onView(content?.slug || content?.id)}
          className="w-full"
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Read Article
        </Button>
      </CardContent>
    </Card>
  );

  if (!content) return null;

  switch (content_type) {
    case 'technique':
      return renderTechniqueCard();
    case 'event':
      return renderEventCard();
    case 'blog':
      return renderBlogCard();
    default:
      return null;
  }
};