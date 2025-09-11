import { ContentBlock } from '@/types/page';

// ⬇️ These paths must match your actual repo tree.
// From your logs, blocks live in src/components/blocks/…
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { SectionBlock } from '@/components/blocks/SectionBlock';
import { TextBlock } from '@/components/blocks/TextBlock';
import { ImageBlock } from '@/components/blocks/ImageBlock';
import { VideoBlock } from '@/components/blocks/VideoBlock';

import PublicEvents from '@/components/blocks/PublicEvents';

export interface ContentBlockRendererProps {
  block: ContentBlock;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  isEditing?: boolean;
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
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
      // Public, read-only list (no admin auth)
      return <PublicEvents />;
    default:
      return (
        <div className="p-4 bg-red-100 text-red-700">
          Unknown block type: {String(block.type)}
        </div>
      );
  }
};
