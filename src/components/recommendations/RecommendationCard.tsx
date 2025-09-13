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

// Normalized content type for safe rendering
interface NormalizedContent {
  title: string;
  subtitle: string;
  imageUrl: string;
  primaryDate: string;
  price: string;
  viewCount: string;
  navTarget: string;
  difficultyLevel: string;
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

// Normalize recommendation content into safe, typed shape
const normalizeRecommendation = (recommendation: Recommendation): NormalizedContent => {
  const { content_type, content } = recommendation;
  
  let title = 'Untitled';
  let subtitle = '';
  let imageUrl = '';
  let primaryDate = '—';
  let price = '';
  let viewCount = '0';
  let navTarget = '';
  let difficultyLevel = '';

  if (content) {
    // Common fields
    title = safeText(content.name || content.title, 'Untitled');
    subtitle = safeText(content.description || content.excerpt, '');
    imageUrl = safeText(content.image_url || content.featured_image_url, '');
    viewCount = safeText(content.view_count ?? 0, '0');
    navTarget = safeText(content.slug || content.id, '');
    difficultyLevel = safeText(content.difficulty_level, '');

    // Type-specific fields
    if (content_type === 'event') {
      primaryDate = safeFormatDate(content.start_date);
      if (content.price_cents) {
        price = formatPrice(Number(content.price_cents) || 0, 'usd');
      }
    } else if (content_type === 'blog') {
      primaryDate = safeFormatDate(content.published_at || content.created_at);
    } else if (content_type === 'technique') {
      primaryDate = safeFormatDate(content.created_at);
    }
  }

  return {
    title,
    subtitle,
    imageUrl,
    primaryDate,
    price,
    viewCount,
    navTarget,
    difficultyLevel,
  };
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onView,
  className = '',
}) => {
  const { content_type, recommendation_type } = recommendation;
  const normalized = normalizeRecommendation(recommendation);

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

  const renderTechniqueCard = () => (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            {normalized.title}
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
        {normalized.imageUrl && (
          <img
            src={normalized.imageUrl}
            alt={normalized.title}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {normalized.subtitle}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {normalized.difficultyLevel && (
              <Badge variant="secondary" className="text-xs">
                {normalized.difficultyLevel}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {normalized.viewCount}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(normalized.navTarget)}
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
            {normalized.title}
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
          {normalized.subtitle}
        </p>
        <div className="space-y-2 mb-4">
          {normalized.primaryDate !== '—' && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{normalized.primaryDate}</span>
            </div>
          )}
          {normalized.price && (
            <div className="text-sm font-semibold">
              {normalized.price}
            </div>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onView(normalized.navTarget)}
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
            {normalized.title}
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
        {normalized.imageUrl && (
          <img
            src={normalized.imageUrl}
            alt={normalized.title}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {normalized.subtitle}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {normalized.viewCount}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onView(normalized.navTarget)}
            className="shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  switch (content_type) {
    case 'technique':
      return renderTechniqueCard();
    case 'event':
      return renderEventCard();
    case 'blog':
      return renderBlogCard();
    default:
      return renderTechniqueCard();
  }
};