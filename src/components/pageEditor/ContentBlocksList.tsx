import { ContentBlock } from '@/types/page';
import { ContentBlockRenderer } from './ContentBlockRenderer';

export interface ContentBlocksListProps {
  contentBlocks: ContentBlock[];
  onEditBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  isPreview?: boolean;
}

export const ContentBlocksList = ({
  contentBlocks,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  isPreview = false,
}: ContentBlocksListProps) => {
  return (
    <div className="space-y-4">
      {contentBlocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          onEdit={onEditBlock}
          onDelete={onDeleteBlock}
          onMoveUp={() => onMoveBlock(block.id, 'up')}
          onMoveDown={() => onMoveBlock(block.id, 'down')}
          isEditing={!isPreview}
        />
      ))}
    </div>
  );
};
