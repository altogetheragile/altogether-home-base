import React, { useMemo } from 'react';
import { ContentBlock } from '@/types/page';
import { ButtonRenderer } from './ButtonRenderer';
import { useDynamicFontSize, getTitleSpacing } from '../../../hooks/useDynamicFontSize';
import { getHeightClass, getBackgroundStyles, getInlineStyles, getStyleClasses } from '../utils/backgroundUtils';

interface TextBlockProps {
  block: ContentBlock;
}

export const TextBlock: React.FC<TextBlockProps> = React.memo(({ block }) => {
  // Ensure block.content exists with safe defaults
  const content = block.content || {};
  const styles = useMemo(() => content.styles || {}, [content.styles]);
  const { titleSize, contentSize, titleStyle, contentStyle } = useDynamicFontSize(styles);
  const inlineStyles = getInlineStyles(styles);
  const styleClasses = getStyleClasses(styles);
  const textBackgroundStyles = getBackgroundStyles(content);

  return (
    <div 
      className={`relative px-4 sm:px-6 md:px-8 ${getHeightClass(content.height, 'text')} ${styleClasses} ${content.backgroundImage ? 'text-white' : ''} w-full max-w-full overflow-hidden`}
      style={{...inlineStyles, ...textBackgroundStyles}}
    >
      {/* Dark overlay for background images to ensure text readability */}
      {content.backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
      )}
      <div className="relative z-10 px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-12 space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-4xl mx-auto">
        {content.title && (
          <h3 
            className={`${titleSize} font-semibold`}
            style={titleStyle}
          >
            {content.title}
          </h3>
        )}
        {content.content && (
          <div className="max-w-none px-2 sm:px-0">
            <p 
              className={`${contentSize} leading-relaxed`}
              style={contentStyle}
            >
              {content.content}
            </p>
          </div>
        )}
        <div>
          <ButtonRenderer content={content} styles={styles} />
        </div>
      </div>
    </div>
  );
});