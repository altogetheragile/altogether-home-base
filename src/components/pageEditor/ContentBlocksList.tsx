import { ContentBlock } from '@/types/page';
import { ContentBlockRenderer } from './ContentBlockRenderer';

export interface ContentBlocksListProps {
  contentBlocks: ContentBlock[];
  onEditBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onAddBlock?: () => void; // ✅ PageEditor passes this
  isPreview?: boolean;
}

export const ContentBlocksList = ({
  contentBlocks,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  onAddBlock,
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
          onMoveUp={(id) => onMoveBlock(block.id, 'up')}
          onMoveDown={(id) => onMoveBlock(block.id, 'down')}
          isEditing={!isPreview}
        />
      ))}

      {onAddBlock && (
        <button
          type="button"
          onClick={onAddBlock}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          + Add Block
        </button>
      )}
    </div>
  );
};
