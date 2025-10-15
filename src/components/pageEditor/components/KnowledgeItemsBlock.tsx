import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';

interface KnowledgeItemsBlockProps {
  block: ContentBlock;
}

export const KnowledgeItemsBlock: React.FC<KnowledgeItemsBlockProps> = ({ block }) => {
  const content = block.content || {};
  
  const title = content.title || 'Knowledge Items';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <RecommendationsSection
        title={title}
        contentTypes={['technique']}
        limit={limit}
        showViewAll={showViewAll}
        excludeIds={excludeIds}
      />
    </div>
  );
};
