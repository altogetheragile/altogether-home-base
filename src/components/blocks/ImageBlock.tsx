import React from "react";
import {
  getHeightClass,
  getBackgroundStyles,
  getInlineStyles,
  getStyleClasses,
} from "@/utils/backgroundUtils";
import type { ContentBlock } from "@/types/page";

interface ImageBlockProps {
  block: ContentBlock;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  return (
    <section
      className={`relative ${getHeightClass(
        block.styles?.height,
        "image"
      )} ${getStyleClasses(block.styles)}`}
      style={getInlineStyles(block.styles)}
    >
      <div
        className="absolute inset-0"
        style={getBackgroundStyles(block.styles)}
      />
      <div className="relative z-10 flex justify-center items-center px-4 py-12">
        {block.content?.imageUrl && (
          <img
            src={block.content.imageUrl}
            alt={block.content.alt || "Image"}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        )}
      </div>
    </section>
  );
};