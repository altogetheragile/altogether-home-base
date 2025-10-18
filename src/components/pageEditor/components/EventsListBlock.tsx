import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface EventsListBlockProps {
  block: ContentBlock;
}

export const EventsListBlock: React.FC<EventsListBlockProps> = ({ block }) => {
  const { settings } = useSiteSettings();
  const content = block.content || {};
  
  // Don't render if events are disabled
  if (!settings?.show_events) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Events are currently unavailable</p>
      </div>
    );
  }
  
  const title = content.title || 'Upcoming Events';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <RecommendationsSection
      className="container mx-auto px-4 py-12"
      title={title}
      contentTypes={['event']}
      limit={limit}
      showViewAll={showViewAll}
      excludeIds={excludeIds}
    />
  );
};
