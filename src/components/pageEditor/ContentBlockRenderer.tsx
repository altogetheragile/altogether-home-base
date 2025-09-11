import { ContentBlock } from '@/types/page';
import { HeroBlock } from '@/components/pageEditor/blocks/HeroBlock';
import { SectionBlock } from '@/components/pageEditor/blocks/SectionBlock';
import { TextBlock } from '@/components/pageEditor/blocks/TextBlock';
import { ImageBlock } from '@/components/pageEditor/blocks/ImageBlock';
import { VideoBlock } from '@/components/pageEditor/blocks/VideoBlock';
import PublicEvents from '@/components/blocks/PublicEvents';

export interface ContentBlockRendererProps {
  block: ContentBlock;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  isEditing?: boolean;
}

export const ContentBlockRenderer = ({
  block,
}: ContentBlockRendererProps) => {
  if (!block?.is_visible) return null;

  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} />;
    case 'section':
      return <SectionBlock block={block} />;
    case 'text':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'video':
      return <VideoBlock block={block} />;
    case 'events':
      return <PublicEvents block={block} />;
    default:
      return (
        <div className="p-4 bg-red-100 text-red-700">
          Unknown block type: {String(block.type)}
        </div>
      );
  }
};
