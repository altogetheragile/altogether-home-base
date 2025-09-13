import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecommendations, useTrackInteraction } from '@/hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface RecommendationsSectionProps {
  title?: string;
  contentType?: 'technique' | 'event' | 'blog';
  limit?: number;
  excludeIds?: string[];
  showViewAll?: boolean;
  className?: string;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  title = "Recommended for You",
  contentType,
  limit = 6,
  excludeIds = [],
  showViewAll = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading, error } = useRecommendations(contentType, limit, excludeIds);
  const trackInteraction = useTrackInteraction();

  const handleView = (id: string) => {
    if (!id) return;
    
    // Find the recommendation to get its content type
    const recommendation = recommendations?.find(r => r.content_id === id || r.content?.slug === id);
    
    if (recommendation) {
      // Track the interaction
      trackInteraction.mutate({
        contentType: recommendation.content_type,
        contentId: recommendation.content_id,
        interactionType: 'view',
      });

      // Navigate based on content type
      switch (recommendation.content_type) {
        case 'technique':
          navigate(`/knowledge/${recommendation.content?.slug || id}`);
          break;
        case 'event':
          navigate(`/events/${id}`);
          break;
        case 'blog':
          navigate(`/blog/${recommendation.content?.slug || id}`);
          break;
        default:
          console.warn('Unknown content type:', recommendation.content_type);
      }
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
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          {showViewAll && <Skeleton className="h-10 w-24" />}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load recommendations</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground">No recommendations available at the moment</p>
          {showViewAll && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleViewAll}
            >
              Browse All Content
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showViewAll && (
          <Button
            variant="outline"
            onClick={handleViewAll}
            className="flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => (
          <ErrorBoundary
            key={`${recommendation.content_type}-${recommendation.content_id}`}
            fallback={
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Unable to load this recommendation</p>
              </div>
            }
          >
            <RecommendationCard
              recommendation={recommendation}
              onView={handleView}
            />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};