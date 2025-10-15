import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';

interface RecommendationsBlockProps {
  block: ContentBlock;
}

export const RecommendationsBlock: React.FC<RecommendationsBlockProps> = ({ block }) => {
  const content = block.content || {};
  
  // Extract configuration from block content with backward compatibility
  const title = content.title || 'Recommended for You';
  const contentTypes = (content.contentTypes || 
    (content.contentType && content.contentType !== 'all' ? [content.contentType] : undefined))?.filter(
      (type: string) => type !== 'testimonial'
    ) as ('technique' | 'event' | 'blog')[] | undefined;
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <RecommendationsSection
        title={title}
        contentTypes={contentTypes}
        limit={limit}
        showViewAll={showViewAll}
        excludeIds={excludeIds}
      />
    </div>
  );
};
