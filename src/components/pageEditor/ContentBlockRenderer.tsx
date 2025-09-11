import HeroBlock from "@/components/pageEditor/blocks/HeroBlock";
import SectionBlock from "@/components/pageEditor/blocks/SectionBlock";
import TextBlock from "@/components/pageEditor/blocks/TextBlock";
import ImageBlock from "@/components/pageEditor/blocks/ImageBlock";
import VideoBlock from "@/components/pageEditor/blocks/VideoBlock";
import PublicEvents from "@/components/blocks/PublicEvents";
import { ContentBlock } from "@/types";

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
