import React from 'react';
import { ContentBlock } from '@/types/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlockErrorBoundary } from '@/components/blocks/BlockErrorBoundary';
import { HeroBlock } from './components/HeroBlock';
import { SectionBlock } from './components/SectionBlock';
import { TextBlock } from './components/TextBlock';
import { ImageBlock } from './components/ImageBlock';
import { VideoBlock } from './components/VideoBlock';
import { RecommendationsBlock } from './components/RecommendationsBlock';
import { TestimonialsCarouselBlock } from './components/TestimonialsCarouselBlock';
import { KnowledgeItemsBlock } from './components/KnowledgeItemsBlock';
import { EventsListBlock } from './components/EventsListBlock';
import { BlogPostsBlock } from './components/BlogPostsBlock';

interface ContentBlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  block,
  isEditing = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  // Normalize content to prevent object-in-JSX issues
  const normalizedBlock = {
    ...block,
    content: (block.content && typeof block.content === 'object') ? block.content : {},
  };
  
  const renderContent = () => {
    try {
      switch (block.type) {
      case 'hero':
        return <HeroBlock block={normalizedBlock} />;
      case 'section':
        return <SectionBlock block={normalizedBlock} />;
      case 'text':
        return <TextBlock block={normalizedBlock} />;
      case 'image':
        return <ImageBlock block={normalizedBlock} />;
      case 'video':
        return <VideoBlock block={normalizedBlock} />;
      case 'recommendations':
        return <RecommendationsBlock block={normalizedBlock} />;
      case 'testimonials-carousel':
        return <TestimonialsCarouselBlock block={normalizedBlock} />;
      case 'knowledge-items':
        return <KnowledgeItemsBlock block={normalizedBlock} />;
      case 'events-list':
        return <EventsListBlock block={normalizedBlock} />;
      case 'blog-posts':
        return <BlogPostsBlock block={normalizedBlock} />;
      default:
        return (
          <div className="py-4 px-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">Unknown content type: {String(block.type)}</p>
          </div>
        );
      }
    } catch (error) {
      console.error('ContentBlockRenderer error:', error, { blockId: block.id, type: block.type });
      return (
        <div className="py-4 px-6 bg-destructive/10 rounded-lg border border-destructive">
          <p className="text-destructive">Failed to render this content block</p>
        </div>
      );
    }
  };

  if (!isEditing) {
    return (
      <div className={!block.is_visible ? 'opacity-50' : ''}>
        <BlockErrorBoundary blockId={String(block.id)}>
          {renderContent()}
        </BlockErrorBoundary>
      </div>
    );
  }

  return (
    <Card className={`relative group ${!block.is_visible ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <BlockErrorBoundary blockId={String(block.id)}>
          {renderContent()}
        </BlockErrorBoundary>
        
        {/* Edit Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 bg-background border rounded-md p-1 shadow-md">
            {onMoveUp && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveUp(block.id)}
                className="h-6 w-6 p-0"
                title="Move up"
              >
                ↑
              </Button>
            )}
            {onMoveDown && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveDown(block.id)}
                className="h-6 w-6 p-0"
                title="Move down"
              >
                ↓
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(block)}
                className="h-6 w-6 p-0"
                title="Edit"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(block.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                title="Delete"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>

        {/* Block Info */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background border rounded px-2 py-1 text-xs text-muted-foreground">
            {block.type} #{block.position}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};