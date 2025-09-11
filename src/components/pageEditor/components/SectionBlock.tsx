import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { useDynamicFontSize, getTitleSpacing } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface SectionBlockProps {
  block: ContentBlock;
}

export const SectionBlock: React.FC<SectionBlockProps> = React.memo(({ block }) => {
  // Ensure block.content exists with safe defaults
  const content = block.content || {};
  const styles = useMemo(() => content.styles || {}, [content.styles]);
  const { titleSize, contentSize, titleStyle, contentStyle } = useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const sectionBackgroundStyles = getBackgroundStyles(content);

  return (
    <div 
      className={`relative px-4 sm:px-6 md:px-8 ${getHeightClass(content.height, 'section')} ${styleClasses} ${content.backgroundImage ? 'text-white' : ''} w-full max-w-full overflow-hidden`}
      style={{...inlineStyles, ...sectionBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-16 space-y-3 sm:space-y-4 md:space-y-8 w-full max-w-6xl mx-auto">
        {content.title && (
          <h2 
            className={`${titleSize} font-bold text-center`}
            style={titleStyle}
          >
            {content.title}
          </h2>
        )}
        {content.content && (
          <div className="mx-auto max-w-4xl px-2 sm:px-4">
            <p 
              className={`${contentSize} leading-relaxed text-center`}
              style={contentStyle}
            >
              {content.content}
            </p>
          </div>
        )}
        <div className="text-center">
          <ButtonRenderer content={content} styles={styles} />
        </div>
      </div>
    </div>
  );
});