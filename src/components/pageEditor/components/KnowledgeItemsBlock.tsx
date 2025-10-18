import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface KnowledgeItemsBlockProps {
  block: ContentBlock;
}

export const KnowledgeItemsBlock: React.FC<KnowledgeItemsBlockProps> = ({ block }) => {
  const { settings } = useSiteSettings();
  const content = block.content || {};
  
  // Don't render if knowledge is disabled
  if (!settings?.show_knowledge) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Knowledge base is currently unavailable</p>
      </div>
    );
  }
  
  const title = content.title || 'Knowledge Items';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <RecommendationsSection
      className="container mx-auto px-4 py-12"
      title={title}
      contentTypes={['technique']}
      limit={limit}
      showViewAll={showViewAll}
      excludeIds={excludeIds}
    />
  );
};
