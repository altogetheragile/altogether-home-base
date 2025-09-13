import React from 'react';
import { ContentBlock } from '@/types/page';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ContentBlocksListProps {
  contentBlocks: ContentBlock[];
  isPreview: boolean;
  onEditBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onAddBlock: () => void;
}

export const ContentBlocksList: React.FC<ContentBlocksListProps> = ({
  contentBlocks,
  isPreview,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  onAddBlock,
}) => {
  const visibleBlocks = contentBlocks
    .filter(block => block.is_visible || !isPreview)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      {visibleBlocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          isEditing={!isPreview}
          onEdit={onEditBlock}
          onDelete={onDeleteBlock}
          onMoveUp={(id) => onMoveBlock(id, 'up')}
          onMoveDown={(id) => onMoveBlock(id, 'down')}
        />
      ))}
      
      {contentBlocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-muted-foreground mb-4">No content blocks yet</p>
          <Button onClick={onAddBlock} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Block
          </Button>
        </div>
      )}
    </div>
  );
};