import React from 'react';
import { ContentBlock } from '@/types/page';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';

interface BlogPostsBlockProps {
  block: ContentBlock;
}

export const BlogPostsBlock: React.FC<BlogPostsBlockProps> = ({ block }) => {
  const content = block.content || {};
  
  const title = content.title || 'Latest Blog Posts';
  const limit = content.limit || 6;
  const showViewAll = content.showViewAll !== false;
  const excludeIds = content.excludeIds || [];

  return (
    <RecommendationsSection
      className="container mx-auto px-4 py-12"
      title={title}
      contentTypes={['blog']}
      limit={limit}
      showViewAll={showViewAll}
      excludeIds={excludeIds}
    />
  );
};
