import React from "react";
import {
  getHeightClass,
  getBackgroundStyles,
  getInlineStyles,
  getStyleClasses,
} from "@/utils/backgroundUtils";
import type { ContentBlock } from "@/types/page";
import { ButtonRenderer } from "@/components/blocks/ButtonRenderer";

interface HeroBlockProps {
  block: ContentBlock;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ block }) => {
  return (
    <section
      className={`relative ${getHeightClass(
        block.styles?.height,
        "hero"
      )} ${getStyleClasses(block.styles)}`}
      style={getInlineStyles(block.styles)}
    >
      <div
        className="absolute inset-0"
        style={getBackgroundStyles(block.styles)}
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16">
        {block.content?.title && (
          <h1 className="text-4xl font-bold mb-4" style={block.styles?.titleStyle}>
            {block.content.title}
          </h1>
        )}
        {block.content?.subtitle && (
          <h2 className="text-xl mb-4" style={block.styles?.subtitleStyle}>
            {block.content.subtitle}
          </h2>
        )}
        {block.content?.content && (
          <p className="max-w-2xl mb-6" style={block.styles?.contentStyle}>
            {block.content.content}
          </p>
        )}
        <ButtonRenderer content={block.content} styles={block.styles} />
      </div>
    </section>
  );
};