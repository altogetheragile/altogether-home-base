import HeroBlock from "@/components/blocks/HeroBlock";
import SectionBlock from "@/components/blocks/SectionBlock";
import TextBlock from "@/components/blocks/TextBlock";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import PublicEvents from "@/components/blocks/PublicEvents"; // ✅ new import

interface ContentBlockRendererProps {
  block: any;
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  if (!block || !block.type) {
    console.warn("⚠️ ContentBlockRenderer: invalid block", block);
    return null;
  }

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
      return <PublicEvents block={block} />; // ✅ use public events
    default:
      console.warn(`⚠️ Unknown block type: ${block.type}`);
      return null;
  }
};
