import { ContentBlock } from '@/types/page';
import { HeroBlock } from '@/components/pageEditor/blocks/HeroBlock';
import { SectionBlock } from '@/components/pageEditor/blocks/SectionBlock';
import { TextBlock } from '@/components/pageEditor/blocks/TextBlock';
import { ImageBlock } from '@/components/pageEditor/blocks/ImageBlock';
import { VideoBlock } from '@/components/pageEditor/blocks/VideoBlock';
import PublicEvents from '@/components/blocks/PublicEvents';

export interface ContentBlockRendererProps {
  block: ContentBlock;
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  if (!block || !block.type) {
    console.warn('⚠️ Invalid content block provided:', block);
    return null;
  }

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
      console.warn(`⚠️ Unknown block type: ${block.type}`);
      return null;
  }
};
