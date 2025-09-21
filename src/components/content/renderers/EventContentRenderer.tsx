import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, DollarSign, Users, Star } from 'lucide-react';
import { format } from 'date-fns';
import { EventMetadata } from '@/types/content';
import { formatPrice } from '@/utils/currency';
import DifficultyBadge from '@/components/events/DifficultyBadge';

interface EventContentRendererProps {
  metadata: EventMetadata;
}

export const EventContentRenderer: React.FC<EventContentRendererProps> = ({ metadata }) => {
  const templateBrandColor = metadata.event_template?.brand_color || '#3B82F6';
  const templateDifficulty = metadata.event_template?.difficulty_rating;
  const templatePopularity = metadata.event_template?.popularity_score || 0;

  return (
    <div className="space-y-3">
      {/* Badges Row */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {metadata.format?.name || 'TBD'}
        </Badge>
        {templatePopularity > 50 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Star size={12} fill="currentColor" />
            Popular
          </Badge>
        )}
        {templateDifficulty && (
          <DifficultyBadge 
            difficulty={templateDifficulty as 'beginner' | 'intermediate' | 'advanced'} 
          />
        )}
      </div>

      {/* Date and Duration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {format(new Date(metadata.start_date), 'MMM d, yyyy')}
            {metadata.end_date && metadata.end_date !== metadata.start_date && 
              ` - ${format(new Date(metadata.end_date), 'MMM d, yyyy')}`
            }
          </span>
        </div>
        {(metadata.event_template?.duration_days && metadata.event_template.duration_days > 1) && (
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{metadata.event_template.duration_days} days</span>
          </div>
        )}
      </div>
      
      {/* Location */}
      {metadata.location && (
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="truncate">{metadata.location.name}</span>
        </div>
      )}
      
      {/* Instructor */}
      {metadata.instructor && (
        <div className="flex items-center text-muted-foreground">
          <User className="h-4 w-4 mr-2" />
          <span className="truncate">{metadata.instructor.name}</span>
        </div>
      )}
      
      {/* Price and Popularity */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-muted-foreground" />
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(metadata.price_cents || 0, metadata.currency)}
          </span>
        </div>
        {templatePopularity > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={12} />
            <span>Popular choice</span>
          </div>
        )}
      </div>
    </div>
  );
};