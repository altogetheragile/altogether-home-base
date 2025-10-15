import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';

interface EventsListBlockProps {
  block: ContentBlock;
}

export const EventsListBlock: React.FC<EventsListBlockProps> = ({ block }) => {
  const content = block.content || {};
  
  const title = content.title || 'Upcoming Events';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <RecommendationsSection
        title={title}
        contentTypes={['event']}
        limit={limit}
        showViewAll={showViewAll}
        excludeIds={excludeIds}
      />
    </div>
  );
};
