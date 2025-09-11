import HeroBlock from "@/components/blocks/HeroBlock";
import SectionBlock from "@/components/blocks/SectionBlock";
import TextBlock from "@/components/blocks/TextBlock";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import PublicEvents from "@/components/blocks/PublicEvents";
import type { ContentBlock } from "@/types/index";

export interface ContentBlockRendererProps {
  block: ContentBlock;
  isEditing?: boolean;
  onEdit?: (block: ContentBlock) => void;
  onDelete?: (blockId: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export const ContentBlockRenderer = ({
  block,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ContentBlockRendererProps) => {
  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} />;
    case "section":
      return <SectionBlock block={block} />;
    case "text":
      return <TextBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "events":
      return <PublicEvents block={block} />;
    default:
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded text-gray-500">
          Unknown block type: {block.type}
        </div>
      );
  }
};
