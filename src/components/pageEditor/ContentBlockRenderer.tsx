import { ContentBlock } from "@/types/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroBlock from "@/components/blocks/HeroBlock";
import SectionBlock from "@/components/blocks/SectionBlock";
import TextBlock from "@/components/blocks/TextBlock";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import PublicEvents from "@/components/blocks/PublicEvents";

interface ContentBlockRendererProps {
  block: ContentBlock;
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  if (!block) return null;

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
      return <PublicEvents />;
    default:
      return (
        <Card className="my-4">
          <CardContent>
            <p className="text-gray-500">
              Unsupported block type: <strong>{block.type}</strong>
            </p>
          </CardContent>
        </Card>
      );
  }
};
