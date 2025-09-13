import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRecommendations, useTrackInteraction } from '@/hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationsSectionProps {
  title?: string;
  contentType?: 'technique' | 'event' | 'blog';
  limit?: number;
  excludeIds?: string[];
  showViewAll?: boolean;
  className?: string;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  title = 'Recommended for You',
  contentType,
  limit = 6,
  excludeIds = [],
  showViewAll = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const { data: recommendations = [], isLoading } = useRecommendations(
    contentType,
    limit,
    excludeIds
  );
  const trackInteraction = useTrackInteraction();

  const handleViewContent = (id: string) => {
    if (!contentType) return;

    // Track the interaction
    trackInteraction.mutate({
      contentType,
      contentId: id,
      interactionType: 'view',
    });

    // Navigate to the content
    switch (contentType) {
      case 'technique':
        navigate(`/knowledge/${id}`);
        break;
      case 'event':
        navigate(`/events/${id}`);
        break;
      case 'blog':
        navigate(`/blog/${id}`);
        break;
    }
  };

  const handleViewAll = () => {
    switch (contentType) {
      case 'technique':
        navigate('/knowledge');
        break;
      case 'event':
        navigate('/events');
        break;
      case 'blog':
        navigate('/blog');
        break;
      default:
        navigate('/knowledge');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {String(title || 'Recommended')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: limit }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {String(title || 'Recommended')}
          </CardTitle>
          {showViewAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="text-primary hover:text-primary/80"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={`${recommendation.content_type}-${recommendation.content_id}`}
              recommendation={recommendation}
              onView={handleViewContent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};