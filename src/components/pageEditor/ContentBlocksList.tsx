import { ContentBlock } from '@/types/page';
import { ContentBlockRenderer } from './ContentBlockRenderer';

interface ContentBlocksListProps {
  blocks: ContentBlock[];
  onEdit: (block: ContentBlock) => void;
  onDelete: (blockId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export const ContentBlocksList = ({
  blocks,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ContentBlocksListProps) => {
  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          onEdit={() => onEdit(block)}
          onDelete={() => onDelete(block.id)}
          onMoveUp={() => onMoveUp(block.id)}
          onMoveDown={() => onMoveDown(block.id)}
        />
      ))}
    </div>
  );
};
