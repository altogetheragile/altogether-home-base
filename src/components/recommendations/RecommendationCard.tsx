// src/components/recommendations/RecommendationCard.tsx - Complete safe version

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, BookOpen, Star, Zap, TrendingUp } from 'lucide-react';
import { Recommendation } from '@/hooks/useRecommendations';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onView: (id: string) => void;
  className?: string;
}

// Safe helper functions
const safeText = (v: any, fallback = ''): string => {
  if (typeof v === 'string' || typeof v === 'number') {
    return String(v);
  }
  return fallback;
};

const safeFormatDate = (v: any): string => {
  try {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '—';
    return format(d, 'MMM dd, yyyy');
  } catch {
    return '—';
  }
};

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
        return <Star className="h-4 w-4 text-muted-foreground" />;
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

  const renderKnowledgeCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {safeText(content?.name || content?.title, 'Untitled')}
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
            src={String(content.image_url)}
            alt={safeText(content?.name || content?.title, '')}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {safeText(content?.description || content?.excerpt, '')}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {content?.difficulty_level && (
              <Badge variant="secondary" className="text-xs">
                {safeText(content.difficulty_level, '')}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {safeText(content?.view_count ?? 0, '0')}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(String(content?.slug || content?.id || ''))}
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
            {safeText(content?.title, 'Untitled Event')}
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
          {safeText(content?.description, '')}
        </p>
        <div className="space-y-2 mb-4">
          {content?.start_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {safeFormatDate(content.start_date)}
                {content?.end_date && content.end_date !== content.start_date && 
                  ` - ${safeFormatDate(content.end_date)}`
                }
              </span>
            </div>
          )}
          {content?.price_cents && (
            <div className="text-sm font-semibold">
              {formatPrice(Number(content.price_cents) || 0, 'usd')}
            </div>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onView(String(content?.id || ''))}
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
            {safeText(content?.title, 'Untitled Post')}
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
            src={String(content.image_url)}
            alt={safeText(content?.title, '')}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {safeText(content?.excerpt || content?.description, '')}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {safeText(content?.view_count ?? 0, '0')}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(String(content?.slug || content?.id || ''))}
            className="shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderVideoCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {safeText(content?.title, 'Untitled Video')}
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
        {content?.video_url && (
          <iframe
            src={String(content.video_url)}
            title={safeText(content?.title, '')}
            className="w-full h-32 rounded-md mb-3"
            frameBorder="0"
            allowFullScreen
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {safeText(content?.description, '')}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {safeText(content?.view_count ?? 0, '0')}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(String(content?.id || ''))}
            className="shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Watch
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  switch (content_type) {
    case 'knowledge_item':
      return renderKnowledgeCard();
    case 'event':
      return renderEventCard();
    case 'blog_post':
      return renderBlogCard();
    case 'video':
      return renderVideoCard();
    default:
      return renderKnowledgeCard();
  }
};
