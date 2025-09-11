import React from "react";
import {
  getHeightClass,
  getBackgroundStyles,
  getInlineStyles,
  getStyleClasses,
} from "@/utils/backgroundUtils";
import type { ContentBlock } from "@/types/page";
import { ButtonRenderer } from "@/components/blocks/ButtonRenderer";

interface TextBlockProps {
  block: ContentBlock;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  return (
    <section
      className={`relative ${getHeightClass(
        block.styles?.height,
        "text"
      )} ${getStyleClasses(block.styles)}`}
      style={getInlineStyles(block.styles)}
    >
      <div
        className="absolute inset-0"
        style={getBackgroundStyles(block.styles)}
      />
      <div className="relative z-10 flex flex-col items-center text-center px-4 py-12">
        {block.content?.title && (
          <h2 className="text-2xl font-semibold mb-4" style={block.styles?.titleStyle}>
            {block.content.title}
          </h2>
        )}
        {block.content?.subtitle && (
          <h3 className="text-lg mb-4" style={block.styles?.subtitleStyle}>
            {block.content.subtitle}
          </h3>
        )}
        {block.content?.content && (
          <p className="mb-6" style={block.styles?.contentStyle}>
            {block.content.content}
          </p>
        )}
        <ButtonRenderer content={block.content} styles={block.styles} />
      </div>
    </section>
  );
};